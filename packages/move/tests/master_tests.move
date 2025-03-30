#[test_only]
module sui_fantasy_sports::contest_tests {
    use sui::test_scenario;
    use sui::object;
   
    use sui::coin as coin_unsafe;
    use sui::tx_context;
    use sui::balance;
    use sui::sui;
    use sui::table;
    

    use sui_fantasy_sports::master::{
        Self, Master, Contest, PLAYER,
        init_for_testing, destroy_master, destroy_contest, create_contest,
        get_contests, get_owner, get_match_name, get_player_names,
        get_player_tiers, get_start_time, get_match_ended, get_redeem_values,
        get_pool_balance
    };

    #[test]
    fun test_create_contest_success() {
        let owner = @0x1;
        let mut scenario = test_scenario::begin(owner);
        
        let mut master = init_for_testing(test_scenario::ctx(&mut scenario));

        let player_names = vector[b"Player1", b"Player2"];
        let player_tiers = vector[1, 2];
        let match_name = b"Match1";
        let start_time = 1000;

        master::create_contest(
            &mut master,
            match_name,
            player_names,
            player_tiers,
            start_time,
            test_scenario::ctx(&mut scenario)
        );

        test_scenario::next_tx(&mut scenario, owner);

        // Get contest ID using the getter and take the shared object
        let contests = master::get_contests(&master);
        let contest_id = *vector::borrow(contests, 0);
        let contest = test_scenario::take_shared_by_id<Contest>(&scenario, contest_id);

        // Validate contest properties
        assert!(master::get_owner(&contest) == owner, 0);
        assert!(master::get_match_name(&contest) == &match_name, 1);
        assert!(vector::length(master::get_player_names(&contest)) == 2, 2);
        assert!(*vector::borrow(master::get_player_names(&contest), 0) == b"Player1", 3);
        assert!(*vector::borrow(master::get_player_tiers(&contest), 1) == 2, 4);
        assert!(master::get_start_time(&contest) == start_time, 5);
        assert!(!master::get_match_ended(&contest), 6);
        assert!(vector::length(master::get_redeem_values(&contest)) == 0, 7);
        assert!(vector::length(master::get_player_treasuries(&contest)) == 1, 8); // Only 1 treasury due to i < 1
        assert!(master::get_pool_balance(&contest) == 0, 9);

        // Validate master contests
        assert!(vector::length(master::get_contests(&master)) == 1, 10);
        assert!(*vector::borrow(master::get_contests(&master), 0) == object::id(&contest), 11);

        // Cleanup
        test_scenario::return_shared(contest);
        destroy_master(master);
        test_scenario::end(scenario);
    }



    #[test]
    #[expected_failure(abort_code = 0)]
    fun test_create_contest_mismatched_vectors() {
        let owner = @0x1;
        let mut scenario = test_scenario::begin(owner);
        
        let mut master = init_for_testing(test_scenario::ctx(&mut scenario));
        
        master::create_contest(
            &mut master,
            b"Match1",
            vector[b"Player1", b"Player2"],
            vector[1],  // Only one tier
            1000,
            test_scenario::ctx(&mut scenario)
        );

        destroy_master(master);
        test_scenario::end(scenario);
    }
}