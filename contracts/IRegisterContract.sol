// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;

interface IRegisterContract {

    function registerTicket(uint256 _eventId, uint256 _ticketId, bytes32 _hashedMessage, bytes32 _r, bytes32 _s, uint8 _v) external;

    function setTicketContractAddress(address _ticketAddress) external;
}