module sui_fantasy_sports::coin_unsafe;

use std::ascii;
use std::string;
use sui::balance::{Self, Balance, Supply};
use sui::url::{Self, Url};

public struct Coin_Unsafe<phantom T> has key, store {
    id: UID,
    balance: Balance<T>,
}

// public use fun sui::pay::split_vec as Coin_Unsafe.split_vec;

// public use fun sui::pay::join_vec as Coin_Unsafe.join_vec;

// public use fun sui::pay::split_and_transfer as Coin_Unsafe.split_and_transfer;

// public use fun sui::pay::divide_and_keep as Coin_Unsafe.divide_and_keep;

// const EBadWitness: u64 = 0;
const EInvalidArg: u64 = 1;
const ENotEnough: u64 = 2;
// const EGlobalPauseNotAllowed: u64 = 3;

public struct Coin_UnsafeMetadata<phantom T> has key, store {
    id: UID,

    decimals: u8,

    name: string::String,

    symbol: ascii::String,

    description: string::String,

    icon_url: Option<Url>,
}

public struct TreasuryCap<phantom T> has key, store {
    id: UID,
    total_supply: Supply<T>,
}

public fun total_supply<T>(cap: &TreasuryCap<T>): u64 {
    balance::supply_value(&cap.total_supply)
}

public fun treasury_into_supply<T>(treasury: TreasuryCap<T>): Supply<T> {
    let TreasuryCap { id, total_supply } = treasury;
    id.delete();
    total_supply
}

public fun supply_immut<T>(treasury: &TreasuryCap<T>): &Supply<T> {
    &treasury.total_supply
}

public fun supply_mut<T>(treasury: &mut TreasuryCap<T>): &mut Supply<T> {
    &mut treasury.total_supply
}


public fun value<T>(self: &Coin_Unsafe<T>): u64 {
    self.balance.value()
}

public fun balance<T>(coin: &Coin_Unsafe<T>): &Balance<T> {
    &coin.balance
}

public fun balance_mut<T>(coin: &mut Coin_Unsafe<T>): &mut Balance<T> {
    &mut coin.balance
}

public fun from_balance<T>(balance: Balance<T>, ctx: &mut TxContext): Coin_Unsafe<T> {
    Coin_Unsafe { id: object::new(ctx), balance }
}

public fun into_balance<T>(coin: Coin_Unsafe<T>): Balance<T> {
    let Coin_Unsafe { id, balance } = coin;
    id.delete();
    balance
}

public fun take<T>(balance: &mut Balance<T>, value: u64, ctx: &mut TxContext): Coin_Unsafe<T> {
    Coin_Unsafe {
        id: object::new(ctx),
        balance: balance.split(value),
    }
}

public fun put<T>(balance: &mut Balance<T>, coin: Coin_Unsafe<T>) {
    balance.join(into_balance(coin));
}


public entry fun join<T>(self: &mut Coin_Unsafe<T>, c: Coin_Unsafe<T>) {
    let Coin_Unsafe { id, balance } = c;
    id.delete();
    self.balance.join(balance);
}

public fun split<T>(self: &mut Coin_Unsafe<T>, split_amount: u64, ctx: &mut TxContext): Coin_Unsafe<T> {
    take(&mut self.balance, split_amount, ctx)
}

public fun divide_into_n<T>(self: &mut Coin_Unsafe<T>, n: u64, ctx: &mut TxContext): vector<Coin_Unsafe<T>> {
    assert!(n > 0, EInvalidArg);
    assert!(n <= value(self), ENotEnough);

    let mut vec = vector[];
    let mut i = 0;
    let split_amount = value(self) / n;
    while (i < n - 1) {
        vec.push_back(self.split(split_amount, ctx));
        i = i + 1;
    };
    vec
}

public fun zero<T>(ctx: &mut TxContext): Coin_Unsafe<T> {
    Coin_Unsafe { id: object::new(ctx), balance: balance::zero() }
}

public fun destroy_zero<T>(c: Coin_Unsafe<T>) {
    let Coin_Unsafe { id, balance } = c;
    id.delete();
    balance.destroy_zero()
}


public fun create_currency<T: drop>(
    witness: T,
    decimals: u8,
    symbol: vector<u8>,
    name: vector<u8>,
    description: vector<u8>,
    icon_url: Option<Url>,
    ctx: &mut TxContext,
): (TreasuryCap<T>, Coin_UnsafeMetadata<T>) {

    // assert!(sui::types::is_one_time_witness(&witness), EBadWitness);

    (
        TreasuryCap {
            id: object::new(ctx),
            total_supply: balance::create_supply(witness),
        },
        Coin_UnsafeMetadata {
            id: object::new(ctx),
            decimals,
            name: string::utf8(name),
            symbol: ascii::string(symbol),
            description: string::utf8(description),
            icon_url,
        },
    )
}

public fun mint<T>(cap: &mut TreasuryCap<T>, value: u64, ctx: &mut TxContext): Coin_Unsafe<T> {
    Coin_Unsafe {
        id: object::new(ctx),
        balance: cap.total_supply.increase_supply(value),
    }
}

public fun mint_balance<T>(cap: &mut TreasuryCap<T>, value: u64): Balance<T> {
    cap.total_supply.increase_supply(value)
}

public entry fun burn<T>(cap: &mut TreasuryCap<T>, c: Coin_Unsafe<T>): u64 {
    let Coin_Unsafe { id, balance } = c;
    id.delete();
    cap.total_supply.decrease_supply(balance)
}

public entry fun mint_and_transfer<T>(
    c: &mut TreasuryCap<T>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    transfer::public_transfer(mint(c, amount, ctx), recipient)
}

public entry fun update_name<T>(
    _treasury: &TreasuryCap<T>,
    metadata: &mut Coin_UnsafeMetadata<T>,
    name: string::String,
) {
    metadata.name = name;
}

public entry fun update_symbol<T>(
    _treasury: &TreasuryCap<T>,
    metadata: &mut Coin_UnsafeMetadata<T>,
    symbol: ascii::String,
) {
    metadata.symbol = symbol;
}

public entry fun update_description<T>(
    _treasury: &TreasuryCap<T>,
    metadata: &mut Coin_UnsafeMetadata<T>,
    description: string::String,
) {
    metadata.description = description;
}

public entry fun update_icon_url<T>(
    _treasury: &TreasuryCap<T>,
    metadata: &mut Coin_UnsafeMetadata<T>,
    url: ascii::String,
) {
    metadata.icon_url = option::some(url::new_unsafe(url));
}


public fun get_decimals<T>(metadata: &Coin_UnsafeMetadata<T>): u8 {
    metadata.decimals
}

public fun get_name<T>(metadata: &Coin_UnsafeMetadata<T>): string::String {
    metadata.name
}

public fun get_symbol<T>(metadata: &Coin_UnsafeMetadata<T>): ascii::String {
    metadata.symbol
}

public fun get_description<T>(metadata: &Coin_UnsafeMetadata<T>): string::String {
    metadata.description
}

public fun get_icon_url<T>(metadata: &Coin_UnsafeMetadata<T>): Option<Url> {
    metadata.icon_url
}


#[test_only]
public fun mint_for_testing<T>(value: u64, ctx: &mut TxContext): Coin_Unsafe<T> {
    Coin_Unsafe { id: object::new(ctx), balance: balance::create_for_testing(value) }
}

#[test_only]
public fun burn_for_testing<T>(coin: Coin_Unsafe<T>): u64 {
    let Coin_Unsafe { id, balance } = coin;
    id.delete();
    balance.destroy_for_testing()
}

#[test_only]
public fun create_treasury_cap_for_testing<T>(ctx: &mut TxContext): TreasuryCap<T> {
    TreasuryCap {
        id: object::new(ctx),
        total_supply: balance::create_supply_for_testing(),
    }
}


public fun supply<T>(treasury: &mut TreasuryCap<T>): &Supply<T> {
    &treasury.total_supply
}

#[allow(unused_field)]
public struct CurrencyCreated<phantom T> has copy, drop {
    decimals: u8,
}
