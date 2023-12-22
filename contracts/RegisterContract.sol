// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITicketContract.sol";
import "./IRegisterContract.sol";

contract RegisterContract is Ownable, IRegisterContract {
    address private _ticketContractAddress;

    /// @dev Constructor setting the contract owner
    constructor() Ownable(msg.sender) {}

    /// @notice Only callers of role Organizer from TicketContract are allowed
    modifier onlyOrganizer() {
        string memory role = ITicketContract(_ticketContractAddress).getAccessRole(msg.sender);
        require(compareStrings(role, "Organizer"), "Only organizers can call this function!");
        _;
    }

    /// @notice Makes a call to the TicketContract registerTicket function if caller has role Organizer
    function registerTicket(uint256 _eventId, uint256 _ticketId, bytes32 _hashedMessage, bytes32 _r, bytes32 _s, uint8 _v) external onlyOrganizer() {
        ITicketContract(_ticketContractAddress).registerTicket(_eventId, _ticketId, _hashedMessage, _r, _s, _v, msg.sender);
    }

    /// @dev Set the TicketContract address if caller is owner of this contract
    function setTicketContractAddress(address _ticketAddress) external onlyOwner() {
        _ticketContractAddress = _ticketAddress;
    }

    /// @dev Compares two strings using keccak256 hashes
    function compareStrings(string memory _a, string memory _b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(_a)) == keccak256(abi.encodePacked(_b));
    }
}