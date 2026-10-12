// SPDX-License-Identifier: MIT
// Hackathon MVP: native Solana program compiled with Solang 0.3.3, not EVM.
import 'solana';
import './vendor/system_instruction.sol';

@program_id("F8B453fWqji2qE6MfLjsQMmmzp9PJDNmLdudrQsoXCuP")
contract Ticketsol {
    address constant ORGANIZER = address"6hVPgsmGGMd4jqSJ2J4kd1XCzWoBbAKT9YHK231tgh81";
    address constant PLATFORM = address"DeQkMFfTKFiHf5DE4R1XrFPWeaHSSEqfUFbq5aM3WuL";
    uint64 constant FACE_VALUE = 100000000;
    struct Ticket { address owner; uint64 price; uint64 generation; bool used; }
    Ticket[64] tickets;
    uint64 sold;
    uint64 capacity;
    string event_name;
    string venue;
    int64 starts_at;

    @payer(payer)
    @space(8192)
    @seed("ticketsol-event")
    constructor(@bump bytes1 bump, string name, string place, int64 starts, uint64 supply) {
        require(tx.accounts.payer.key == ORGANIZER, "Untrusted organizer");
        require(supply > 0 && supply <= 64, "Capacity 1-64");
        require(bytes(name).length > 0 && bytes(name).length <= 100, "Invalid name");
        require(bytes(place).length > 0 && bytes(place).length <= 180, "Invalid venue");
        event_name = name; venue = place; starts_at = starts; capacity = supply;
    }

    function event_info() external view returns (string name, string place, int64 starts, uint64 supply, uint64 count) {
        return (event_name, venue, starts_at, capacity, sold);
    }
    function ticket_info(uint64 id) external view returns (address owner, uint64 price, uint64 generation, bool used) {
        require(id < sold, "Unknown ticket");
        Ticket t = tickets[id];
        return (t.owner, t.price, t.generation, t.used);
    }

    @mutableSigner(buyer)
    @mutableAccount(organizer)
    @account(systemAccount)
    function buy() external {
        require(sold < capacity, "Sold out");
        require(tx.accounts.organizer.key == ORGANIZER, "Wrong organizer");
        require(tx.accounts.systemAccount.key == address"11111111111111111111111111111111", "Wrong system program");
        require(tx.accounts.buyer.key != ORGANIZER, "Use buyer wallet");
        SystemInstruction.transfer(tx.accounts.buyer.key, ORGANIZER, FACE_VALUE);
        tickets[sold] = Ticket(tx.accounts.buyer.key, 0, 1, false);
        sold += 1;
    }

    @signer(seller)
    function list(uint64 id, uint64 price) external {
        require(id < sold, "Unknown ticket");
        require(tickets[id].owner == tx.accounts.seller.key, "Not owner");
        require(!tickets[id].used, "Already used");
        require(price <= FACE_VALUE, "Price exceeds face value");
        tickets[id].price = price; // zero cancels a listing, never transfers ownership
    }

    @mutableSigner(buyer)
    @mutableAccount(seller)
    @mutableAccount(organizer)
    @mutableAccount(platform)
    @account(systemAccount)
    function resale(uint64 id, uint64 expected_price, uint64 expected_generation) external {
        require(id < sold, "Unknown ticket");
        Ticket t = tickets[id];
        require(!t.used && t.price > 0 && t.price <= FACE_VALUE, "Not for sale");
        require(t.price == expected_price && t.generation == expected_generation, "Listing changed");
        require(tx.accounts.seller.key == t.owner, "Wrong seller");
        require(tx.accounts.buyer.key != t.owner, "Already owner");
        require(tx.accounts.organizer.key == ORGANIZER && tx.accounts.platform.key == PLATFORM, "Wrong fee recipients");
        require(tx.accounts.systemAccount.key == address"11111111111111111111111111111111", "Wrong system program");
        uint64 organizer_fee = t.price * 5 / 100;
        uint64 platform_fee = t.price * 2 / 100;
        SystemInstruction.transfer(tx.accounts.buyer.key, t.owner, t.price - organizer_fee - platform_fee);
        SystemInstruction.transfer(tx.accounts.buyer.key, ORGANIZER, organizer_fee);
        SystemInstruction.transfer(tx.accounts.buyer.key, PLATFORM, platform_fee);
        tickets[id].owner = tx.accounts.buyer.key;
        tickets[id].generation += 1;
        tickets[id].price = 0;
    }

    @signer(checker)
    function redeem(uint64 id, uint64 expected_generation) external {
        require(tx.accounts.checker.key == ORGANIZER, "Not authorized");
        require(id < sold, "Unknown ticket");
        require(!tickets[id].used, "Already used");
        require(tickets[id].generation == expected_generation, "Ticket transferred");
        tickets[id].used = true;
        tickets[id].price = 0;
    }
}
