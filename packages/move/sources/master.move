module sui_fantasy_sports::master {
    use std::vector;
    use std::string::{Self, String};
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID, ID};

    const EInvalidPlayerIndex: u64 = 100;
    const EInsufficientBalance: u64 = 104;
    const EMatchNotEnded: u64 = 1;
    const EInvalidNFTId: u64 = 404;
    const ENotOwner: u64 = 4;
    const EInvalidLength: u64 = 0;
    const EZeroScoreOrWeights: u64 = 7;
    const ENotNFTOwner: u64 = 106;
    const EInvalidAmount: u64 = 108;
    const EPlayerNFTLimitExceeded: u64 = 109;
    const ETotalNFTLimitExceeded: u64 = 110;

    const POOL_FEE_FRACTION: u64 = 20;

    const COST_TIER1: u64 = 300;
    const COST_TIER2: u64 = 200;
    const COST_TIER3: u64 = 100;

    const WEIGHT_TIER1: u64 = 1;
    const WEIGHT_TIER2: u64 = 2;
    const WEIGHT_TIER3: u64 = 3;

    const MAX_NFTS_PER_PLAYER: u64 = 5;
    const MAX_NFTS_PER_MATCH: u64 = 40;

    public struct PlayerNFT has key, store {
        id: UID,
        name: String,
        idx: u64, // Player index
        amount: u64, // Redeemable amount in SUI (set during sell)
    }

    public struct PlayerPurchased has copy, store, drop {}
    public struct PlayerSold has copy, store, drop {}

    public struct Master has key, store {
        id: UID,
        owner: address,
        contests: vector<ID>,
        contestsCount: u64,
    }

    public struct Contest has key, store {
        id: UID,
        owner: address,
        player_names: vector<String>,
        player_tiers: vector<u64>,
        player_nft_counts: vector<u64>, // Tracks the number of NFTs per player
        total_nft_count: u64, // Tracks the total number of NFTs in the match
        redeem_values: vector<u64>,
        pool: Balance<SUI>,
        fee_controller: Balance<SUI>,
        start_time: u64,
        match_name: String,
        match_ended: bool,
        player_nft_ids: Table<ID, u64>, // Maps NFT ID to player index
        owned_nfts: Table<address, vector<ID>>, // Maps user address to their owned NFT IDs
    }

    fun init(ctx: &mut TxContext) {
        let master = Master {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            contests: vector::empty<ID>(),
            contestsCount: 0,
        };
        transfer::share_object(master);
    }

    public entry fun create_contest(
        master: &mut Master,
        match_name: String,
        player_names: vector<String>,
        player_tiers: vector<u64>,
        start_time: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == master.owner, ENotOwner);
        assert!(vector::length(&player_names) == vector::length(&player_tiers), EInvalidLength);

        let mut player_nft_counts = vector::empty<u64>();
        let mut i = 0;
        while (i < vector::length(&player_names)) {
            vector::push_back(&mut player_nft_counts, 0);
            i = i + 1;
        };

        let contest = Contest {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            player_names,
            player_tiers,
            player_nft_counts,
            total_nft_count: 0,
            redeem_values: vector::empty<u64>(),
            pool: balance::zero(),
            fee_controller: balance::zero(),
            start_time,
            match_name,
            match_ended: false,
            player_nft_ids: table::new<ID, u64>(ctx),
            owned_nfts: table::new<address, vector<ID>>(ctx),
        };

        vector::push_back(&mut master.contests, object::id(&contest));
        master.contestsCount = master.contestsCount + 1;
        transfer::public_share_object(contest);
    }

    public entry fun end_match(contest: &mut Contest, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == contest.owner, ENotOwner);
        contest.match_ended = true;
    }

    public entry fun reset_redeem_values(contest: &mut Contest, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == contest.owner, ENotOwner);
        contest.redeem_values = vector::empty();
    }

    public entry fun rebalance(
        contest: &mut Contest,
        player_scores: vector<u64>,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == contest.owner, ENotOwner);
        assert!(contest.match_ended == true, EMatchNotEnded);
        assert!(vector::length(&player_scores) == vector::length(&contest.player_names), EInvalidLength);

        // Clear redeem_values to prevent appending
        contest.redeem_values = vector::empty();

        // Take the fee from the pool
        let pool_before = balance::value(&contest.pool);
        let fees = balance::split(&mut contest.pool, pool_before / POOL_FEE_FRACTION);
        balance::join(&mut contest.fee_controller, fees);

        let total_pool = balance::value(&contest.pool);
        let mut total_score: u64 = 0;
        let mut i = 0;
        while (i < vector::length(&player_scores)) {
            total_score = total_score + *vector::borrow(&player_scores, i);
            i = i + 1;
        };
        assert!(total_score > 0, EZeroScoreOrWeights);

        let mut total_weighted_nfts: u64 = 0;
        i = 0;
        while (i < vector::length(&contest.player_tiers)) {
            let nft_count = *vector::borrow(&contest.player_nft_counts, i);
            let tier_weight = get_tier_weight(*vector::borrow(&contest.player_tiers, i));
            total_weighted_nfts = total_weighted_nfts + (nft_count * tier_weight);
            i = i + 1;
        };
        assert!(total_weighted_nfts > 0, EZeroScoreOrWeights);

        // Calculate the redeem value per NFT for each player
        i = 0;
        while (i < vector::length(&player_scores)) {
            let player_score = *vector::borrow(&player_scores, i);
            let player_nft_count = *vector::borrow(&contest.player_nft_counts, i);
            let player_tier_weight = get_tier_weight(*vector::borrow(&contest.player_tiers, i));
            let redeem_value = if (player_nft_count > 0) {
                (player_score * player_tier_weight * total_pool) / (total_score * total_weighted_nfts)
            } else {
                0
            };
            vector::push_back(&mut contest.redeem_values, redeem_value);
            i = i + 1;
        };
    }

    public entry fun buy(
        contest: &mut Contest,
        player_index: u64,
        amount: u64,
        payment: Coin<SUI>,
        ctx: &mut TxContext,
    ) {
        assert!(contest.match_ended == false, 101);
        assert!(player_index < vector::length(&contest.player_names), EInvalidPlayerIndex);
        assert!(amount > 0, EInvalidAmount);

        // Check per-player NFT limit
        let current_player_nfts = *vector::borrow(&contest.player_nft_counts, player_index);
        assert!(current_player_nfts + amount <= MAX_NFTS_PER_PLAYER, EPlayerNFTLimitExceeded);

        // Check total NFT limit for the match
        assert!(contest.total_nft_count + amount <= MAX_NFTS_PER_MATCH, ETotalNFTLimitExceeded);

        let player_tier = *vector::borrow(&contest.player_tiers, player_index);
        let player_cost = get_tier_cost(player_tier);
        let total_cost = player_cost * amount;

        let sender = tx_context::sender(ctx);
        assert!(coin::value(&payment) >= total_cost, EInsufficientBalance);

        // Initialize owned_nfts for the sender if not present
        if (!table::contains(&contest.owned_nfts, sender)) {
            table::add(&mut contest.owned_nfts, sender, vector::empty<ID>());
        };

        // Take payment and add to the pool
        let mut payment_balance = coin::into_balance(payment);
        let payment_amount = balance::split(&mut payment_balance, total_cost);
        balance::join(&mut contest.pool, payment_amount);

        if (balance::value(&payment_balance) > 0) {
            transfer::public_transfer(coin::from_balance(payment_balance, ctx), sender);
        } else {
            balance::destroy_zero(payment_balance);
        };

        // Update the player_nft_counts and total_nft_count
        let nft_count = vector::borrow_mut(&mut contest.player_nft_counts, player_index);
        *nft_count = *nft_count + amount;
        contest.total_nft_count = contest.total_nft_count + amount;

        // Mint the specified number of NFTs
        let player_name = *vector::borrow(&contest.player_names, player_index);
        let owned = table::borrow_mut(&mut contest.owned_nfts, sender);
        let mut i = 0;
        while (i < amount) {
            let nft = PlayerNFT {
                id: object::new(ctx),
                name: player_name,
                idx: player_index,
                amount: 0, // Initial amount is 0
            };
            let nft_id = object::id(&nft);
            table::add(&mut contest.player_nft_ids, nft_id, player_index);
            vector::push_back(owned, nft_id);
            transfer::public_transfer(nft, sender);
            i = i + 1;
        };

        event::emit(PlayerPurchased {});
    }

    public entry fun sell(
        contest: &mut Contest,
        nft: PlayerNFT,
        ctx: &mut TxContext,
    ) {
        assert!(contest.match_ended == true, EMatchNotEnded);
        let nft_id = object::id(&nft);
        assert!(table::contains(&contest.player_nft_ids, nft_id), EInvalidNFTId);

        let player_index = *table::borrow(&contest.player_nft_ids, nft_id);
        assert!(player_index < vector::length(&contest.player_names), EInvalidPlayerIndex);
        assert!(vector::length(&contest.redeem_values) > player_index, EInvalidPlayerIndex);

        let sender = tx_context::sender(ctx);
        assert!(table::contains(&contest.owned_nfts, sender), ENotNFTOwner);
        let owned = table::borrow_mut(&mut contest.owned_nfts, sender);
        let mut found = false;
        let mut i = 0;
        let len = vector::length(owned);
        while (i < len) {
            if (*vector::borrow(owned, i) == nft_id) {
                vector::swap_remove(owned, i);
                found = true;
                break;
            };
            i = i + 1;
        };
        assert!(found, ENotNFTOwner);

        // Update the NFT's amount with the redeem_value
        let redeem_value = *vector::borrow(&contest.redeem_values, player_index);
        assert!(balance::value(&contest.pool) >= redeem_value, EInsufficientBalance);
        let mut nft = nft;
        nft.amount = redeem_value;

        // Withdraw the amount as SUI from the pool
        let payout_balance = balance::split(&mut contest.pool, redeem_value);
        let payout = coin::from_balance(payout_balance, ctx);
        transfer::public_transfer(payout, sender);

        // Decrement the player_nft_counts and total_nft_count
        let nft_count = vector::borrow_mut(&mut contest.player_nft_counts, player_index);
        *nft_count = *nft_count - 1;
        contest.total_nft_count = contest.total_nft_count - 1;

        // Remove the NFT from player_nft_ids and destroy the NFT
        table::remove(&mut contest.player_nft_ids, nft_id);
        let PlayerNFT { id, name: _, idx: _, amount: _ } = nft;
        object::delete(id);

        event::emit(PlayerSold {});
    }
    public entry fun withdraw_fees(contest: &mut Contest, ctx: &mut TxContext) {
        assert!(tx_context::sender(ctx) == contest.owner, ENotOwner);
        let fee_amount = balance::value(&contest.fee_controller);
        if (fee_amount > 0) {
            let fees = balance::split(&mut contest.fee_controller, fee_amount);
            transfer::public_transfer(coin::from_balance(fees, ctx), contest.owner);
        };
    }
    public fun get_owner(contest: &Contest): address {
        contest.owner
    }

    public fun get_match_name(contest: &Contest): String {
        contest.match_name
    }

    public fun get_player_names(contest: &Contest): vector<String> {
        contest.player_names
    }

    public fun get_start_time(contest: &Contest): u64 {
        contest.start_time
    }

    public fun get_match_ended(contest: &Contest): bool {
        contest.match_ended
    }

    public fun get_player_tiers(contest: &Contest): vector<u64> {
        contest.player_tiers
    }

    public fun get_redeem_values(contest: &Contest): vector<u64> {
        contest.redeem_values
    }

    public fun get_pool_balance(contest: &Contest): u64 {
        balance::value(&contest.pool)
    }

    public fun get_fee_balance(contest: &Contest): u64 {
        balance::value(&contest.fee_controller)
    }

    public fun get_player_nft_ids(contest: &Contest): &Table<ID, u64> {
        &contest.player_nft_ids
    }

    public fun get_owned_nfts(contest: &Contest): &Table<address, vector<ID>> {
        &contest.owned_nfts
    }

    public fun get_player_nft_counts(contest: &Contest): vector<u64> {
        contest.player_nft_counts
    }

    public fun get_total_nft_count(contest: &Contest): u64 {
        contest.total_nft_count
    }

    public fun set_match_ended_for_testing(contest: &mut Contest, ended: bool) {
        contest.match_ended = ended;
    }

    public fun get_tier_cost(tier: u64): u64 {
        assert!(tier >= 1 && tier <= 3, EInvalidLength);
        if (tier == 1) { return COST_TIER1 };
        if (tier == 2) { return COST_TIER2 };
        COST_TIER3
    }

    public fun get_tier_weight(tier: u64): u64 {
        assert!(tier >= 1 && tier <= 3, EInvalidLength);
        if (tier == 1) { return WEIGHT_TIER1 };
        if (tier == 2) { return WEIGHT_TIER2 };
        WEIGHT_TIER3
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext): Master {
        Master {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            contests: vector::empty<ID>(),
            contestsCount: 0,
        }
    }

    #[test_only]
    public fun destroy_master(master: Master) {
        let Master { id, owner: _, contests: _, contestsCount: _ } = master;
        object::delete(id);
    }

    #[test_only]
    public fun drain_balances_for_testing(pool: &mut Balance<SUI>, fee_controller: &mut Balance<SUI>, ctx: &mut TxContext) {
        let pool_value = balance::value(pool);
        if (pool_value > 0) {
            let pool_funds = balance::split(pool, pool_value);
            transfer::public_transfer(coin::from_balance(pool_funds, ctx), @0x0);
        };
        let fee_value = balance::value(fee_controller);
        if (fee_value > 0) {
            let fee_funds = balance::split(fee_controller, fee_value);
            transfer::public_transfer(coin::from_balance(fee_funds, ctx), @0x0);
        };
    }

    #[test_only]
    public fun destroy_contest(contest: Contest, ctx: &mut TxContext) {
        let Contest { 
            id, 
            owner: _, 
            player_names: _, 
            player_tiers: _, 
            player_nft_counts: _, 
            total_nft_count: _, 
            redeem_values: _, 
            mut pool, 
            mut fee_controller, 
            start_time: _, 
            match_name: _, 
            match_ended: _, 
            player_nft_ids, 
            owned_nfts 
        } = contest;
        object::delete(id);
        drain_balances_for_testing(&mut pool, &mut fee_controller, ctx);
        balance::destroy_zero(pool);
        balance::destroy_zero(fee_controller);
        table::drop(player_nft_ids);
        table::drop(owned_nfts);
    }

    #[test_only]
    public fun set_pool_balance_for_testing(contest: &mut Contest, amount: u64, _ctx: &mut TxContext) {
        let balance = balance::create_for_testing<SUI>(amount);
        balance::join(&mut contest.pool, balance);
    }
}