module sui_fantasy_sports::master;

use sui::{
    sui::SUI,
    balance,
    table,
    event,
    
};


use sui_fantasy_sports::coin_unsafe;

const EInvalidPlayerIndex: u64 = 100;
const EExceedsMaxQuantity: u64 = 103;
const EInsufficientBalance: u64 = 104;
const EInsufficientTokens: u64 = 105;
const EMatchNotEnded: u64 = 1;
const EInvalidTokenId: u64 = 404;

const PLAYER_TOKEN_DECIMALS: u8 = 0;
const PLAYER_TOKEN_SUPPLY: u64 = 5000;
const PLAYER_TOKEN_PER_USER_LIMIT: u64 = 5;
const POOL_FEE_FRACTION: u64 = 20;

const COST_TIER1: u64 = 300;
const COST_TIER2: u64 = 200;
const COST_TIER3: u64 = 100;

const WEIGHT_TIER1: u64 = 1;
const WEIGHT_TIER2: u64 = 2;
const WEIGHT_TIER3: u64 = 3;

public struct PLAYER has drop {} // Assume we have authority over this struct   

public struct PlayerPurchased has copy, store, drop {  }
public struct PlayerSold has copy, store, drop {  }

public struct Master has key, store {
    id: UID,
    owner: address,
    contests: vector<ID>,
    contestsCount: u64
}

public struct Contest has key, store {
    id: UID,
    owner: address,

    player_names: vector<vector<u8>>,
    player_tiers: vector<u64>,
    player_treasuries: vector<coin_unsafe::TreasuryCap<PLAYER>>,
    redeem_values: vector<u64>,
    
    pool: balance::Balance<SUI>,
    feeController: balance::Balance<SUI>,
    
    start_time: u64,
    match_name: vector<u8>,
    match_ended: bool,
    
    player_token_ids: table::Table<ID, u64>,
    bought_tokens: table::Table<address, vector<u64>>,
}

//-- This is init function - called once when publishing --//
fun init(ctx: &mut TxContext) {
    let master = Master{
        id: object::new(ctx),
        owner: tx_context::sender(ctx),
        contests: vector::empty<ID>(),
        contestsCount: 0
    };
    transfer::share_object(master);
}

public entry fun create_contest(
        master: &mut Master,
        match_name: vector<u8>,
        player_names: vector<vector<u8>>,
        player_tiers: vector<u64>,
        start_time: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == master.owner, 1);
        assert!(vector::length(&player_names) == vector::length(&player_tiers), 0);

        let contest_id = object::new(ctx);

        let mut player_treasuries = vector::empty<coin_unsafe::TreasuryCap<PLAYER>>();
        let mut i = 0;
        while (i < 1) {
            let ref_coin_name: &vector<u8> = vector::borrow(&player_names, i);
            let mut coin_name: vector<u8> = *ref_coin_name;
            coin_name.append(b" for ");
            coin_name.append(match_name);

            let (treasury, metadata) = coin_unsafe::create_currency(
                PLAYER {},
                PLAYER_TOKEN_DECIMALS,
                *vector::borrow(&player_names, i),
                coin_name,
                b"copyright : AviraL",
                option::none(),
                ctx,
            );

            transfer::public_freeze_object(metadata);
            vector::push_back(&mut player_treasuries, treasury);

            i = i + 1;
        };

        let contest = Contest {
            id: contest_id,
            owner: tx_context::sender(ctx),
            player_names,
            player_tiers,
            player_treasuries,
            redeem_values: vector::empty<u64>(),
            pool: balance::zero(),
            feeController: balance::zero(),
            start_time,
            match_name,
            match_ended: false,
            player_token_ids: table::new<ID, u64>(ctx),
            bought_tokens: table::new<address, vector<u64>>(ctx),
        };

        vector::push_back(&mut master.contests, object::id(&contest ));
        master.contestsCount = master.contestsCount + 1;
        transfer::public_share_object(contest); // Share instead of return
    }

public entry fun rebalance(
    contest: &mut Contest,
    player_scores: vector<u64>,
    ctx: &mut TxContext
) {
    assert!(tx_context::sender(ctx) != contest.owner, 4);
    assert!(contest.match_ended == true, 5);
    assert!(vector::length(&player_scores) == vector::length(&contest.player_names), 6);

    let pool_before = balance::value(&contest.pool); // 1000
    let fees = balance::split(&mut contest.pool, pool_before / POOL_FEE_FRACTION); // 50
    balance::join(&mut contest.feeController, fees);

    let total_pool = balance::value(&contest.pool); // 950
    let mut total_score: u64 = 0;
    let mut i = 0;
    while (i < vector::length(&player_scores)) {
        total_score = total_score + *vector::borrow(&player_scores, i); // 100
        i = i + 1;
    };
    assert!(total_score > 0, 7);

    let mut total_tier_weights: u64 = 0;
    i = 0;
    while (i < vector::length(&contest.player_tiers)) {
        total_tier_weights = total_tier_weights + get_tier_weight(*vector::borrow(&contest.player_tiers, i)); // 6
        i = i + 1;
    };
    assert!(total_tier_weights > 0, 7);

    i = 0;
    while (i < vector::length(&player_scores)) {
        let player_score = *vector::borrow(&player_scores, i); // 50 for i=0
        let player_tier_weight = get_tier_weight(*vector::borrow(&contest.player_tiers, i)); // 1 for i=0
        let redeem_value = (player_score * player_tier_weight * total_pool) / (total_score * total_tier_weights);
        vector::push_back(&mut contest.redeem_values, redeem_value);
        i = i + 1;
    };
    contest.match_ended = true;
}

public entry fun get_all_players(contest: &Contest): (vector<vector<u8>>, vector<u64>) {
    return (contest.player_names, contest.player_tiers)
}

// In master.move
public fun check_buy_quantity(
    contest: &Contest,
    player_index: u64,
    quantity: u64,
    sender: address
): u64 {
    assert!(player_index < vector::length(&contest.player_names), EInvalidPlayerIndex);
    if (!table::contains(&contest.bought_tokens, sender)) {
        return quantity // For a new user, just return the requested quantity
    };
    let balances_vector = table::borrow(&contest.bought_tokens, sender);
    *vector::borrow(balances_vector, player_index) + quantity
}

// Update buy to use it
public entry fun buy(
    contest: &mut Contest,
    player_index: u64,
    quantity: u64,
    payment: coin_unsafe::Coin_Unsafe<SUI>,
    ctx: &mut TxContext,
) {
    assert!(contest.match_ended == false, 101);
    assert!(player_index < vector::length(&contest.player_names), EInvalidPlayerIndex);

    let player_tier = *vector::borrow(&contest.player_tiers, player_index);
    let player_cost = get_tier_cost(player_tier);
    let total_cost = player_cost * quantity;

    let sender = tx_context::sender(ctx);
    if (!table::contains(&contest.bought_tokens, sender)) {
        let mut new_vec = vector::empty<u64>();
        let mut i = 0;
        while (i < vector::length(&contest.player_names)) {
            vector::push_back(&mut new_vec, 0);
            i = i + 1;
        };
        table::add(&mut contest.bought_tokens, sender, new_vec);
    };

    let total_quantity = check_buy_quantity(contest, player_index, quantity, sender);
    assert!(total_quantity <= PLAYER_TOKEN_PER_USER_LIMIT, EInsufficientTokens);

    assert!(coin_unsafe::value(&payment) >= total_cost, EInsufficientBalance);

    let treasury = vector::borrow_mut(&mut contest.player_treasuries, player_index);
    assert!(quantity + coin_unsafe::total_supply(treasury) <= PLAYER_TOKEN_SUPPLY, EInsufficientTokens);
    
    let mut payment_balance = coin_unsafe::into_balance(payment);
    let payment_amount = balance::split(&mut payment_balance, total_cost);
    balance::join(&mut contest.pool, payment_amount);

    if (balance::value(&payment_balance) > 0) {
        transfer::public_transfer(coin_unsafe::from_balance(payment_balance, ctx), sender);
    } else {
        balance::destroy_zero(payment_balance);
    };

    let bought_mut = table::borrow_mut(&mut contest.bought_tokens, sender);
    let player_bought_mut = vector::borrow_mut(bought_mut, player_index);
    *player_bought_mut = *player_bought_mut + quantity;

    let coins = coin_unsafe::mint(treasury, quantity, ctx);
    
    let coin_id: ID = object::id(&coins);
    table::add(&mut contest.player_token_ids, coin_id, player_index);

    transfer::public_transfer(coins, sender);

    event::emit(PlayerPurchased { });
}
public entry fun sell(
    contest: &mut Contest,
    tokens: coin_unsafe::Coin_Unsafe<PLAYER>,
    ctx: &mut TxContext,
) {
    assert!(contest.match_ended == true, EMatchNotEnded);
    let token_id = object::id(&tokens);
    assert!(table::contains(&contest.player_token_ids, token_id), EInvalidTokenId);
    let player_index = *table::borrow(&contest.player_token_ids, token_id);
    assert!(player_index < vector::length(&contest.player_names), EInvalidPlayerIndex);
    assert!(vector::length(&contest.redeem_values) > player_index, EInvalidPlayerIndex);

    let quantity = coin_unsafe::value(&tokens);
    let sender = tx_context::sender(ctx);
    let bought_vec = table::borrow_mut(&mut contest.bought_tokens, sender);
    let current_bought = vector::borrow_mut(bought_vec, player_index);
    assert!(*current_bought >= quantity, EInsufficientTokens); // This should trigger 105

    let redeem_value = *vector::borrow(&contest.redeem_values, player_index);
    let refund_owed = redeem_value * quantity;
    assert!(balance::value(&contest.pool) >= refund_owed, EInsufficientBalance);

    *current_bought = *current_bought - quantity;

    let treasury = vector::borrow_mut(&mut contest.player_treasuries, player_index);
    coin_unsafe::burn(treasury, tokens);

    let refund = balance::split(&mut contest.pool, refund_owed);
    transfer::public_transfer(coin_unsafe::from_balance(refund, ctx), sender);

    event::emit(PlayerSold {});
}


public fun get_player_token_supply(contest: &Contest, player_index: u64): u64 {
    let treasury = vector::borrow(&contest.player_treasuries, player_index);
    coin_unsafe::total_supply(treasury) // Assuming this is your custom function
}
public fun get_master_owner(master: &Master): address {
        master.owner
}
public fun get_contests(master: &Master): &vector<ID> {
        &master.contests
}
public fun get_owner(contest: &Contest): address {
    contest.owner
}

public fun get_match_name(contest: &Contest): &vector<u8> {
    &contest.match_name
}

public fun get_player_names(contest: &Contest): &vector<vector<u8>> {
    &contest.player_names
}

public fun get_start_time(contest: &Contest): u64 {
    contest.start_time
}

public fun get_match_ended(contest: &Contest): bool {
    contest.match_ended
}

public fun get_player_tiers(contest: &Contest): &vector<u64> {
    &contest.player_tiers
}

public fun get_player_treasuries(contest: &Contest): &vector<coin_unsafe::TreasuryCap<PLAYER>> {
    &contest.player_treasuries
}

public fun get_redeem_values(contest: &Contest): &vector<u64> {
    &contest.redeem_values
}

public fun get_pool_balance(contest: &Contest): u64 {
        balance::value(&contest.pool)
}

public fun get_fee_balance(contest: &Contest): &balance::Balance<SUI> {
    &contest.feeController
}


public fun get_player_token_ids(contest: &Contest): &table::Table<ID, u64> {
    &contest.player_token_ids
}

public fun get_bought_tokens(contest: &Contest): &table::Table<address, vector<u64>> {
    &contest.bought_tokens
}

public fun set_match_ended_for_testing(contest: &mut Contest, ended: bool) {
    contest.match_ended = ended;
}
public fun get_tier_cost(tier: u64): u64 {
    assert!(tier >= 1 && tier <= 3, 0);
    if (tier == 1) { return COST_TIER1 };
    if (tier == 2) { return COST_TIER2 };
    COST_TIER3
}

public fun get_tier_weight(tier: u64): u64 {  // Made public
    assert!(tier >= 1 && tier <= 3, 0);
    if (tier == 1) { return WEIGHT_TIER1 };
    if (tier == 2) { return WEIGHT_TIER2 };
    WEIGHT_TIER3
}


#[test_only]
public fun init_for_testing(ctx: &mut TxContext): Master {  // Fixed return type
        Master {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            contests: vector::empty<ID>(),
            contestsCount: 0
        }
    }

#[test_only]
public fun destroy_master(master: Master) {
    let Master { id, owner: _, contests: _, contestsCount: _ } = master;
    object::delete(id);
}

#[test_only]
public fun drain_balances_for_testing(pool: &mut balance::Balance<SUI>, feeController: &mut balance::Balance<SUI>, ctx: &mut TxContext) {
    let pool_value = balance::value(pool);
    if (pool_value > 0) {
        let pool_funds = balance::split(pool, pool_value);
        transfer::public_transfer(coin_unsafe::from_balance(pool_funds, ctx), @0x0);
    };
    let fee_value = balance::value(feeController);
    if (fee_value > 0) {
        let fee_funds = balance::split(feeController, fee_value);
        transfer::public_transfer(coin_unsafe::from_balance(fee_funds, ctx), @0x0);
    };
}
#[test_only]
public fun destroy_contest(contest: Contest, ctx: &mut TxContext) {
    let Contest { 
        id, 
        owner: _, 
        player_names: _, 
        player_tiers: _, 
        mut player_treasuries, 
        redeem_values: _, 
        mut pool, 
        mut feeController, 
        start_time: _, 
        match_name: _, 
        match_ended: _, 
        player_token_ids, 
        bought_tokens 
    } = contest;
    object::delete(id);
    while (!vector::is_empty(&player_treasuries)) {
        let treasury = vector::pop_back(&mut player_treasuries);
        transfer::public_transfer(treasury, @0x0);
    };
    vector::destroy_empty(player_treasuries);
    drain_balances_for_testing(&mut pool, &mut feeController, ctx);
    balance::destroy_zero(pool);
    balance::destroy_zero(feeController);
    table::drop(player_token_ids); // Drop instead of destroy_empty
    table::drop(bought_tokens);    // Drop instead of destroy_empty
}
#[test_only]
public fun set_pool_balance_for_testing(contest: &mut Contest, amount: u64, _ctx: &mut TxContext) {
    let balance = balance::create_for_testing<SUI>(amount);
    balance::join(&mut contest.pool, balance);
}
#[test_only]
public fun mint_test_tokens(
    contest: &mut Contest,
    player_index: u64,
    quantity: u64,
    ctx: &mut TxContext
): coin_unsafe::Coin_Unsafe<PLAYER> {
    assert!(player_index < vector::length(&contest.player_names), EInvalidPlayerIndex);
    let treasury = vector::borrow_mut(&mut contest.player_treasuries, player_index);
    let coins = coin_unsafe::mint(treasury, quantity, ctx);
    let coin_id = object::id(&coins);
    table::add(&mut contest.player_token_ids, coin_id, player_index);
    coins
}
#[test_only]
public fun create_player_for_testing(): PLAYER {
    PLAYER {}
}
// In master.move
#[test_only]
public fun create_test_treasury(ctx: &mut TxContext): coin_unsafe::TreasuryCap<PLAYER> {
    let (treasury, metadata) = coin_unsafe::create_currency(
        PLAYER {}, 0, b"Test", b"TEST", b"", option::none(), ctx
    );
    transfer::public_freeze_object(metadata);
    treasury
}
}

// #[test]
// fun test_create_contest() {
//     let mut ctx = tx_context::dummy();
//     let mut master = init_for_testing(&mut ctx);

//     let player_names = vector[
//         b"Player1",
//         b"Player2"
//     ];
//     let player_tiers = vector[1, 2];
//     let match_name = b"Match1";
//     let start_time = 1000;

//     let contest = create_contest(&mut master, match_name, player_names, player_tiers, start_time, &mut ctx);

//     assert!(get_owner(&contest) == tx_context::sender(&ctx), 0); // 0x0 from dummy()
//     assert!(get_match_name(&contest) == match_name, 1);
//     assert!(vector::length(get_player_names(&contest)) == 2, 2);
//     assert!(*vector::borrow(get_player_names(&contest), 0) == b"Player1", 3);
//     assert!(*vector::borrow(get_player_tiers(&contest), 1) == 2, 4);
//     assert!(get_start_time(&contest) == start_time, 5);
//     assert!(get_match_ended(&contest) == false, 6);
//     // assert!(vector::length(get_player_treasuries(&contest)) == 2, 7);
//     assert!(vector::length(get_redeem_values(&contest)) == 0, 8);
//     assert!(get_pool_balance(&contest) == 0, 9);

//     let contest_id = object::id(&contest);
//     assert!(vector::length(get_contests(&master)) == 1, 10);
//     assert!(*vector::borrow(get_contests(&master), 0) == contest_id, 11);

//     // Cleanup using destroy functions
//     destroy_contest(contest, &mut ctx);
//     destroy_master(master);
    
// }