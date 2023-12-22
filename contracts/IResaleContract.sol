// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;

interface IResaleContract {

    struct ListedTicket {
        uint256 listingId;
        address payable listingOwner;
        uint256 listingPrice;
        bool hasBeenResold;
        bool listedForResale;
        uint256 tokenId;
        uint256 eventId;
        uint256 seatNr;
        string eventName;
        string eventLocation;
        string eventDate;
        string eventTime;
        uint256 ticketsPrCustomer;
    }

    function listTicketForSale(uint256 _ticketId, uint256 _resalePrice) external;

    function getTicketsForResale() external view returns (ListedTicket[] memory);

    function getTicketsListedBySender() external view returns (ListedTicket[] memory);

    function withdrawFromResaleList(uint256 _ticketId) external;

    function purchaseTicketFromResale(uint256 _ticketId) external payable;

    function setListingLimit(uint256 _limit) external;

    function getListingLimit() external view returns (uint256);

    function setTicketContractAddress(address _ticketAddress) external;
}