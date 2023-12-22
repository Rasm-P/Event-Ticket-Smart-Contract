// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;

interface ITicketContract {

    struct EventVenue {
        uint256 id;
        string eventName;
        string eventDescription;
        uint256 numberOfTickets;
        uint256 ticketsLeft;
        string eventLocation;
        string eventDate;
        string eventTime;
        uint256 ticketPrice;
        uint256 ticketsPrCustomer;
        string imageUrl;
        address venueOwner;
    }

    struct NFTData {
        uint256 tokenId;
        uint256 eventId;
        uint256 seatNr;
        bool usedStatus;
    }

    function addEvent(
        string memory _eventName,
        string memory _eventDescription,
        uint256 _numberOfTickets,
        string memory _eventLocation,
        string memory _eventDate,
        string memory _eventTime,
        uint256 _ticketPrice,
        uint256 _ticketsPrCustomer,
        string memory _imageUrl
    ) external;

    function purchaseTicket(uint256 _eventId, uint256[] memory _ticketSeatNumbers) external payable;

    function setContractApprovals() external;

    function areContractsApproved() external view returns (bool);

    function setResaleContract(address _resaleAddress) external;

    function setRegisterContract(address _registerAddress) external;

    function getAllEvents() external view returns (EventVenue[] memory);

    function getEventById(uint256 _eventId) external view returns (EventVenue memory);

    function getSenderNFTs() external view returns (NFTData[] memory);

    function getSeatsSoldForEvent(uint256 _eventId) external view returns (uint256[] memory);

    function getCustomerTicketsForEvent(uint256 _eventId) external view returns (uint256[] memory);

    function promoteToOrganizer(address _address) external;

    function getAccessRole(address _account) external view returns (string memory);

    function withdrawContractFunds() external;

    function getTicketData(uint256 _ticketId) external view returns (NFTData memory);

    function getOwnerOfSeat(uint256 _eventId, uint256 _seatNr) external view returns (address);

    function getTotalTicketsPurchasedForEvent(uint256 _eventId, address _address) external view returns (uint256);

    function incrementCustomerTicketCount(uint256 _eventId, address _address) external;

    function transferTicket(address _oldOwner, address _newOwner, uint256 _ticketId) external;

    function registerTicket(uint256 _eventId, uint256 _ticketId, bytes32 _hashedMessage, bytes32 _r, bytes32 _s, uint8 _v, address _organizer) external;

    function getTicketUsedStatus(uint256 _ticketId) external view returns(bool);

    function setEventVenueOwner(uint256 _eventId, address _owner) external;
}
