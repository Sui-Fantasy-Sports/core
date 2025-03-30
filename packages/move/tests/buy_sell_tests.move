#[test_only]
module sui_fantasy_sports::master_tests {
    use sui::test_scenario;
    use sui::object::{Self, ID};
    use sui::transfer;
    use sui_fantasy_sports::coin_unsafe;
    use sui::tx_context::{Self, TxContext};
    use sui::balance;
    use sui::table;
    use sui::sui::SUI;
    use std::vector;
    use sui_fantasy_sports::master::{
        Self, Master, Contest, PLAYER,
        init_for_testing, destroy_master, destroy_contest, create_contest,
        buy, sell, check_buy_quantity, get_bought_tokens, get_pool_balance,
        get_player_names, get_player_tiers, get_tier_cost, get_player_token_supply,
        set_match_ended_for_testing, rebalance, mint_test_tokens, create_test_treasury,
        set_pool_balance_for_testing, get_redeem_values
    };

    // Re-export constants for clarity
    const EInvalidPlayerIndex: u64 = 100;
    const EExceedsMaxQuantity: u64 = 103;
    const EInsufficientBalance: u64 = 104;
    const EInsufficientTokens: u64 = 105;
    const EMatchNotEnded: u64 = 1;

    const PLAYER_TOKEN_PER_USER_LIMIT: u64 = 5;
    const PLAYER_TOKEN_SUPPLY: u64 = 5000;

    // Helper to create a contest and return its ID
    #[test_only]
    fun create_test_contest(
        master: &mut sui_fantasy_sports::master::Master,
        match_name: vector<u8>,
        player_names: vector<vector<u8>>,
        player_tiers: vector<u64>,
        start_time: u64,
        ctx: &mut TxContext
    ): ID {
        master::create_contest(master, match_name, player_names, player_tiers, start_time, ctx);
        *vector::borrow(master::get_contests(master), 0)
    }

    #[test]
    fun test_buy_success() {
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        }; // ctx goes out of scope here

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(900), ctx);
            master::buy(&mut contest, 0, 3, payment, ctx);
        }; // ctx goes out of scope here

        // Verify state
        let bought_tokens = master::get_bought_tokens(&contest);
        let bought_vec = table::borrow(bought_tokens, sender);
        assert!(*vector::borrow(bought_vec, 0) == 3, 0);
        assert!(master::get_pool_balance(&contest) == 900, 1);

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 101)]
    fun test_buy_contest_ended() {
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            master::set_match_ended_for_testing(&mut contest, true);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(300), ctx);
            master::buy(&mut contest, 0, 1, payment, ctx);
        };

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 100)]
    fun test_buy_invalid_player_index() {
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(300), ctx);
            master::buy(&mut contest, 1, 1, payment, ctx);
        };

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code =104)]
    fun test_buy_insufficient_payment() {
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(200), ctx);
            master::buy(&mut contest, 0, 1, payment, ctx);
        };

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 105)]
    fun test_buy_exceeds_max_quantity() {
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(1800), ctx);
            master::buy(&mut contest, 0, PLAYER_TOKEN_PER_USER_LIMIT + 1, payment, ctx);
        };

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

#[test]
#[expected_failure(abort_code = 105)] // Expecting EInsufficientTokens
fun test_buy_exceeds_token_supply() {
    let sender = @0xA;
    let mut scenario = test_scenario::begin(sender);
    
    let contest_id;
    {
        let ctx = test_scenario::ctx(&mut scenario);
        let mut master = init_for_testing(ctx);
        contest_id = create_test_contest(&mut master, b"TestMatch", vector[b"Player1"], vector[1u64], 1000, ctx);
        destroy_master(master);
    };

    test_scenario::next_tx(&mut scenario, sender);
    
    let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
    {
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Buy some tokens but stay under per-user limit
        let initial_amount = PLAYER_TOKEN_PER_USER_LIMIT / 2; // Use half the limit first
        let payment1 = coin_unsafe::from_balance(balance::create_for_testing<SUI>(initial_amount * 1000), ctx);
        master::buy(&mut contest, 0, initial_amount, payment1, ctx);
        
        // Try to buy more than remaining total supply
        test_scenario::next_tx(&mut scenario, sender);
        let ctx = test_scenario::ctx(&mut scenario);
        let remaining_supply = PLAYER_TOKEN_SUPPLY - initial_amount;
        let exceed_amount = remaining_supply + 1; // Just enough to exceed total supply
        let payment2 = coin_unsafe::from_balance(balance::create_for_testing<SUI>(exceed_amount * 1000), ctx);
        master::buy(&mut contest, 0, exceed_amount, payment2, ctx);
    };

    test_scenario::return_shared(contest);
    test_scenario::end(scenario);
}
    #[test]
    fun test_buy_with_refund() {
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(1000), ctx);
            master::buy(&mut contest, 0, 3, payment, ctx);
        };

        // Verify state
        let bought_tokens = master::get_bought_tokens(&contest);
        let bought_vec = table::borrow(bought_tokens, sender);
        assert!(*vector::borrow(bought_vec, 0) == 3, 0);
        assert!(master::get_pool_balance(&contest) == 900, 1);

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

    fun test_sell_success() {
    let owner = @0xB;
    let sender = @0xA;
    let mut scenario = test_scenario::begin(owner);
    
    let contest_id;
    {
        let ctx = test_scenario::ctx(&mut scenario);
        let mut master = init_for_testing(ctx);
        contest_id = create_test_contest(
            &mut master,
            b"TestMatch",
            vector[b"Player1"],
            vector[1u64], // Tier 1
            1000,
            ctx
        );
        destroy_master(master);
    };

    test_scenario::next_tx(&mut scenario, sender);
    
    let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
    {
        let ctx = test_scenario::ctx(&mut scenario);
        
        // Check initial state
        let initial_pool = master::get_pool_balance(&contest);
        let tier_cost = master::get_tier_cost(1); // Added contest reference
        
        // Buy 3 tokens
        let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(1000), ctx);
        master::buy(&mut contest, 0, 3, payment, ctx);

        // Verify pool after buy
        let pool_after_buy = master::get_pool_balance(&contest);
        let expected_pool_after_buy = initial_pool + (3 * tier_cost);
        assert!(pool_after_buy == expected_pool_after_buy, 2);

        // Sell setup
        master::set_match_ended_for_testing(&mut contest, true);
        let player_scores = vector[50];
        master::rebalance(&mut contest, player_scores, ctx);

        // Set pool balance and sell
        master::set_pool_balance_for_testing(&mut contest, 1000, ctx);
        let tokens = master::mint_test_tokens(&mut contest, 0, 2, ctx);
        master::sell(&mut contest, tokens, ctx);
    };

    // Verify final state
    let bought_tokens = master::get_bought_tokens(&contest);
    let bought_vec = table::borrow(bought_tokens, sender);
    assert!(*vector::borrow(bought_vec, 0) == 1, 0); // 3 bought - 2 sold = 1 remaining
    
    let redeem_values = master::get_redeem_values(&contest);
    let redeem_value = *vector::borrow(redeem_values, 0);
    
    // Add debug check
    let pool_balance = master::get_pool_balance(&contest);
    assert!(redeem_value <= 500, 3); // Ensure redeem_value won't cause underflow
    let expected_pool = 1000 - (2 * redeem_value);
    assert!(pool_balance == expected_pool, 1);
    assert!(pool_balance <= 1000, 4); // Pool shouldn't exceed initial value

    test_scenario::return_shared(contest);
    test_scenario::end(scenario);
}

    #[test]
    #[expected_failure(abort_code = 1)]
    fun test_sell_match_not_ended() {
        let sender = @0xA;
        let mut scenario = test_scenario::begin(sender);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(1000), ctx);
            master::buy(&mut contest, 0, 3, payment, ctx);

            let tokens = master::mint_test_tokens(&mut contest, 0, 2, ctx);
            master::sell(&mut contest, tokens, ctx);
        };

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 404)]
    fun test_sell_invalid_token_id() {
        let owner = @0xB;
        let sender = @0xA;
        let mut scenario = test_scenario::begin(owner);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(1000), ctx);
            master::buy(&mut contest, 0, 3, payment, ctx);

            master::set_match_ended_for_testing(&mut contest, true);
            let player_scores = vector[50];
            master::rebalance(&mut contest, player_scores, ctx);

            let mut treasury = master::create_test_treasury(ctx);
            let invalid_tokens = coin_unsafe::mint(&mut treasury, 1, ctx);
            transfer::public_transfer(treasury, @0x0);

            master::sell(&mut contest, invalid_tokens, ctx);
        };

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 105)]
    fun test_sell_exceeds_owned() {
        let owner = @0xB;
        let sender = @0xA;
        let mut scenario = test_scenario::begin(owner);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(1000), ctx);
            master::buy(&mut contest, 0, 2, payment, ctx);

            master::set_match_ended_for_testing(&mut contest, true);
            let player_scores = vector[50];
            master::rebalance(&mut contest, player_scores, ctx);

            let tokens = master::mint_test_tokens(&mut contest, 0, 3, ctx);
            master::sell(&mut contest, tokens, ctx);
        };

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 104)]
    fun test_sell_insufficient_pool() {
        let owner = @0xB;
        let sender = @0xA;
        let mut scenario = test_scenario::begin(owner);
        
        let contest_id;
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let mut master = init_for_testing(ctx);
            contest_id = create_test_contest(
                &mut master,
                b"TestMatch",
                vector[b"Player1"],
                vector[1u64],
                1000,
                ctx
            );
            destroy_master(master);
        };

        test_scenario::next_tx(&mut scenario, sender);
        
        let mut contest = test_scenario::take_shared<sui_fantasy_sports::master::Contest>(&mut scenario);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let payment = coin_unsafe::from_balance(balance::create_for_testing<SUI>(1000), ctx);
            master::buy(&mut contest, 0, 3, payment, ctx);

            master::set_match_ended_for_testing(&mut contest, true);
            let player_scores = vector[1000];
            master::rebalance(&mut contest, player_scores, ctx);

            let tokens = master::mint_test_tokens(&mut contest, 0, 3, ctx);
            master::sell(&mut contest, tokens, ctx);
        };

        test_scenario::return_shared(contest);
        test_scenario::end(scenario);
    }
}