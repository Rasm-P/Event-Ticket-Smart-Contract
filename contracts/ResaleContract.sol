// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITicketContract.sol";
import "./IResaleContract.sol";

// Built with inspiration from ArtNiche ArtMarketplaceContract.sol, Sergio Sánchez Sánchez: https://github.com/sergio11/art_niche_nft_marketplace_hardhat_solidity/blob/master/contracts/ArtMarketplaceContract.sol (Accessed: 17-10-2023)

contract ResaleContract is Ownable, IResaleContract {
    uint256 private _listingIdCounter;
    uint256 private _listingCounter;
    address private _ticketContractAddress;
    uint256 private _listingLimit = 3;

    mapping(uint256 => ListedTicket) private listingIdToResaleTickets;
    mapping(address => uint256) private customerListingCount;

    /// @dev Constructor setting the contract owner
    constructor() Ownable(msg.sender) {}

    /// Inspired by ArtNiche ArtMarketplaceContract.sol putItemForSale function
    /// @notice Lists a ticket token with a token ID for sale at a specified resale price
    function listTicketForSale(uint256 _ticketId, uint256 _resalePrice) external {
        require(msg.sender == ERC721(_ticketContractAddress).ownerOf(_ticketId), "Only the owner of the ticket can call this function!");
        require(_resalePrice > 1, "Resale price must be greater than 1 wei!");
        require(customerListingCount[msg.sender] < _listingLimit, "Customer cannot put up more listings than the listing limit!");
        
        ITicketContract(_ticketContractAddress).transferTicket(msg.sender, address(this), _ticketId);
        ITicketContract.NFTData memory ticketData = ITicketContract(_ticketContractAddress).getTicketData(_ticketId);
        ITicketContract.EventVenue memory eventVenue = ITicketContract(_ticketContractAddress).getEventById(ticketData.eventId);

        require(_resalePrice <= eventVenue.ticketPrice, "Resale price cannot be higher than purchase price!");

        uint256 listingId = _listingIdCounter;
        _listingIdCounter += 1;
        _listingCounter += 1;
        listingIdToResaleTickets[listingId] = ListedTicket(
            listingId,
            payable(msg.sender),
            _resalePrice,
            false,
            true,
            ticketData.tokenId,
            ticketData.eventId,
            ticketData.seatNr,
            eventVenue.eventName,
            eventVenue.eventLocation,
            eventVenue.eventDate,
            eventVenue.eventTime,
            eventVenue.ticketsPrCustomer
        );
        customerListingCount[msg.sender] += 1;
    }

    /// @notice Returns all the ticket tokens listed for resale
    function getTicketsForResale() external view returns (ListedTicket[] memory) {
        ListedTicket[] memory list = new ListedTicket[](_listingCounter);
        uint256 loopCount = 0;
        for (uint i = 0; i < _listingIdCounter; i++) {
            if (listingIdToResaleTickets[i].listedForResale) {
                list[loopCount] = listingIdToResaleTickets[i];
                loopCount += 1;
            }
        }
        return list;
    }

    /// @notice Returns all the ticket tokens listed by the caller
    function getTicketsListedBySender() external view returns (ListedTicket[] memory) {
        ListedTicket[] memory list = new ListedTicket[](customerListingCount[msg.sender]);
        uint256 loopCount = 0;
        for (uint i = 0; i < _listingIdCounter; i++) {
            if (listingIdToResaleTickets[i].listedForResale) {
                if (listingIdToResaleTickets[i].listingOwner == msg.sender) {
                    list[loopCount] = listingIdToResaleTickets[i];
                    loopCount += 1;
                }
            }
        }
        return list;
    }

    /// Inspired by ArtNiche ArtMarketplaceContract.sol withdrawFromSale function
    /// @notice Withdraws a ticket token from the resale list by its ID
    function withdrawFromResaleList(uint256 _listingId) external {
        ListedTicket memory listing = listingIdToResaleTickets[_listingId];

        require(msg.sender == listing.listingOwner, "Sender must be listing owner!");
        require(listing.listedForResale && !listing.hasBeenResold, "Listing must still be for sale!");

        ITicketContract(_ticketContractAddress).transferTicket(address(this), msg.sender, listing.tokenId);
        listingIdToResaleTickets[_listingId].listedForResale = false;
        _listingCounter -= 1;
        customerListingCount[msg.sender] -= 1;
    }

    /// Inspired by ArtNiche ArtMarketplaceContract.sol buyItem function
    /// @notice Transfers the ownership of a listed ticket token to the caller buyer at the cost of payable funds transacted to the listing owner
    function purchaseTicketFromResale(uint256 _listingId) external payable {
        ListedTicket memory listing = listingIdToResaleTickets[_listingId];
        uint256 totalTickets = ITicketContract(_ticketContractAddress).getTotalTicketsPurchasedForEvent(listing.eventId,msg.sender);

        require(msg.sender != listing.listingOwner, "Customer cannot buy their own tickets!");
        require(totalTickets < listing.ticketsPrCustomer, "Customer ticket count for event must be lower than the limit!");
        require(msg.value == listing.listingPrice, "Sender value must equal the listing price!");
        require(listing.listedForResale && !listing.hasBeenResold, "Listing must still be for sale!");

        ITicketContract(_ticketContractAddress).transferTicket(address(this), msg.sender, listing.tokenId);
        listingIdToResaleTickets[_listingId].listedForResale = false;
        listingIdToResaleTickets[_listingId].hasBeenResold = true;
        _listingCounter -= 1;
        ITicketContract(_ticketContractAddress).incrementCustomerTicketCount(listing.eventId,msg.sender);
         (bool success, ) = listing.listingOwner.call{value: msg.value}("");
        require(success, "Payment transfer failed!");
        customerListingCount[listing.listingOwner] -= 1;
    }

    /// @dev Set the limit for how many ticket tokens a user can list for resale if caller is owner of this contract
    function setListingLimit(uint256 _limit) external onlyOwner() {
        _listingLimit = _limit;
    }

    /// @notice Returns the current user listing limit
    function getListingLimit() external view returns (uint256) {
        return _listingLimit;
    }

    /// @dev Set the TicketContract address if caller is owner of this contract
    function setTicketContractAddress(address _ticketAddress) external onlyOwner() {
        _ticketContractAddress = _ticketAddress;
    }
}