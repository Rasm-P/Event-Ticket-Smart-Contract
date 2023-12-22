// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ITicketContract.sol";

// Built with inspiration from DAPP University TokenMaster.sol: https://github.com/dappuniversity/tokenmaster/blob/master/contracts/TokenMaster.sol (Accessed: 04-10-2023)

contract TicketContract is ERC721, ERC721Burnable, AccessControl, ITicketContract {
    uint256 private _tokenIdCounter;
    uint256 private _eventIdCounter;
    address private _resaleContractAddress;
    address private _registerContractAddress;
    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER_ROLE");
    address public contractAdmin;

    mapping(uint256 => EventVenue) private eventVenues;
    mapping(uint256 => uint256[]) private soldSeatsList;
    mapping(uint256 => mapping(address => uint256[])) private customerTicketsPerEvent;
    mapping(uint256 => mapping(address => uint256)) private customerTotalSeatsPurchased;
    mapping(uint256 => mapping(uint256 => address)) private ticketOwner;
    mapping(address => uint256[]) private customerNFTs;
    mapping(uint256 => NFTData) private tokenIdToNFTData;

    /// @dev Constructor taking the ERC721 name and symbol
    constructor(string memory _name, string memory _symbol) 
    ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORGANIZER_ROLE, msg.sender);
        contractAdmin = msg.sender;
    }

    /// @notice Only callers of role ORGANIZER_ROLE are allowed
    modifier onlyOrganizer() {
        require(hasRole(ORGANIZER_ROLE, msg.sender), "Only organizers can call this function!");
        _;
    }

    /// @notice Only callers of role DEFAULT_ADMIN_ROLE are allowed
    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Only admins can call this function!");
        _;
    }

    /// @notice Only calls from the resale contract address is allowed
    modifier onlyResaleContract() {
        require(msg.sender == _resaleContractAddress, "Address should equal resale contract address!");
        _;
    }

    /// @notice Only calls from the register contract address is allowed
    modifier onlyRegisterContract() {
        require(msg.sender == _registerContractAddress, "Address should equal register contract address!");
        _;
    }

    /// @dev Overrides required by Solidity to support access control
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// Inspired by DAPP University TokenMaster.sol list function
    /// @notice Adds a new event venue if caller has role ORGANIZER_ROLE
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
    ) external onlyOrganizer {
        uint256 eventId = _eventIdCounter;
        _eventIdCounter += 1;
        eventVenues[eventId] = EventVenue(
            eventId,
            _eventName,
            _eventDescription,
            _numberOfTickets,
            _numberOfTickets,
            _eventLocation,
            _eventDate,
            _eventTime,
            _ticketPrice,
            _ticketsPrCustomer,
            _imageUrl,
            msg.sender
        );
    }

    /// Inspired by DAPP University TokenMaster.sol mint function
    /// @notice Mints ticket NFTs for a specific event for each of the specified seat numbers
    function purchaseTicket(uint256 _eventId, uint256[] memory _ticketSeatNumbers) external payable {
        EventVenue memory eventVenue = eventVenues[_eventId];
        require(_eventId < _eventIdCounter, "That event ID does not exist!");
        require(msg.value >= eventVenue.ticketPrice * _ticketSeatNumbers.length, "Value cannot be lower than price!");
        require(eventVenue.ticketsLeft >= _ticketSeatNumbers.length, "Cannot purchase more tickets than there are seats left!");
        require(customerTotalSeatsPurchased[_eventId][msg.sender] + _ticketSeatNumbers.length <= eventVenue.ticketsPrCustomer, "Cannot purchase more tickets than the event limit!");
        
        for (uint256 i = 0; i < _ticketSeatNumbers.length; i++) {
            require(_ticketSeatNumbers[i] <= eventVenue.numberOfTickets, "Cannot pick seats that are not part of the event!");
            require(ticketOwner[_eventId][_ticketSeatNumbers[i]] == address(0), "Can only purchase a seat that is not already owned!");
        }
        
        // Reduce the number of tickets available
        eventVenues[_eventId].ticketsLeft -= _ticketSeatNumbers.length;
        // Loop over and mint each ticket
        for (uint256 i = 0; i < _ticketSeatNumbers.length; i++) {
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter += 1;
            // Add seat number to the sold seats list
            soldSeatsList[_eventId].push(_ticketSeatNumbers[i]);
            // Map token ID to NFT
            tokenIdToNFTData[tokenId] = NFTData(tokenId, _eventId,_ticketSeatNumbers[i],false);
            // Set seat number owner
            ticketOwner[_eventId][_ticketSeatNumbers[i]] = msg.sender;
            // Add seat number to tickets purchased by user per event
            customerTicketsPerEvent[_eventId][msg.sender].push(_ticketSeatNumbers[i]);
            // Add NFT data to address mapping
            customerNFTs[msg.sender].push(tokenId);
            // Increase customer number of seats purchased
            customerTotalSeatsPurchased[_eventId][msg.sender] += 1;
            _safeMint(msg.sender, tokenId);
        }
    }

    /// @notice Sets approval for the resale and register contracts to transfer NFTs on behalf of the caller
    function setContractApprovals() external {
        // Give full approval rights to the ResaleContract address
        setApprovalForAll(_resaleContractAddress, true);
        // Give full approval rights to the RegisterContract address
        setApprovalForAll(_registerContractAddress, true);
    }

    /// @notice Returns a boolean indicating if the resale and register contracts are approved to transfer NFTs on behalf of the caller
    function areContractsApproved() external view returns (bool) {
        bool resaleApproval = isApprovedForAll(msg.sender, _resaleContractAddress);
        bool registerApproval = isApprovedForAll(msg.sender, _registerContractAddress);
        return resaleApproval && registerApproval;
    }

    /// @dev Sets the ResaleContract address if caller has role DEFAULT_ADMIN_ROLE
    function setResaleContract(address _resaleAddress) external onlyAdmin() {
        _resaleContractAddress = _resaleAddress;
    }

    /// @dev Sets the RegisterContract address if caller has role DEFAULT_ADMIN_ROLE
    function setRegisterContract(address _registerAddress) external onlyAdmin() {
        _registerContractAddress = _registerAddress;
    }

    /// @notice Returns all event venues
    function getAllEvents() external view returns (EventVenue[] memory) {
        uint256 numberOfEvents = _eventIdCounter;
        EventVenue[] memory arr = new EventVenue[](numberOfEvents);
        for (uint i = 0; i < numberOfEvents; i++) {
            arr[i] = eventVenues[i];
        }
        return arr;
    }

    /// @notice Returns an event venue by its ID
    function getEventById(uint256 _eventId) external view returns (EventVenue memory) {
        return eventVenues[_eventId];
    }

    /// @notice Returns the ticket NFTs of the caller
    function getSenderNFTs() external view returns (NFTData[] memory) {
        uint256 length = customerNFTs[msg.sender].length;
        NFTData[] memory nfts = new NFTData[](length);
        for (uint256 i = 0; i < length; i++) {
            nfts[i] = tokenIdToNFTData[customerNFTs[msg.sender][i]];
        }
        return nfts;
    }

    /// @notice Returns the number of seats sold for a particular event ID
    function getSeatsSoldForEvent(uint256 _eventId) external view returns (uint256[] memory) {
        return soldSeatsList[_eventId];
    }

    /// @notice Returns the number of tickets bought by the caller for a particular event ID
    function getCustomerTicketsForEvent(uint256 _eventId) external view returns (uint256[] memory) {
        return customerTicketsPerEvent[_eventId][msg.sender];
    }

    /// @dev Promotes an address to the role of ORGANIZER_ROLE if the caller has role DEFAULT_ADMIN_ROLE
    function promoteToOrganizer(address _address) external onlyAdmin {
        _grantRole(ORGANIZER_ROLE, _address);
    }

    /// @notice Returns the access role of a particular address
    function getAccessRole(address _account) external view returns (string memory) {
        if (hasRole(DEFAULT_ADMIN_ROLE, _account)) {
            return "Admin";
        } else if (hasRole(ORGANIZER_ROLE, _account)) {
            return "Organizer";
        } else {
            return "No role";
        }
    }

    /// @dev Transfers contract funds to the contract admin address if caller has role DEFAULT_ADMIN_ROLE
    function withdrawContractFunds() external onlyAdmin {
        payable(contractAdmin).transfer(address(this).balance);
    }

    /// @dev Returns the NFT ticket data of a particular ticket token ID if caller is the resale contract address
    function getTicketData(uint256 _ticketId) external view onlyResaleContract() returns (NFTData memory) {
        return tokenIdToNFTData[_ticketId];
    }

    /// @notice Returns the owner of a seat given the event ID and seat number if caller has role ORGANIZER_ROLE
    function getOwnerOfSeat(uint256 _eventId, uint256 _seatNr) external view onlyOrganizer() returns (address) {
        return ticketOwner[_eventId][_seatNr];
    }

    /// @dev Returns the number of tickets/seats purchased by a particular address for an event if caller is the resale contract address
    function getTotalTicketsPurchasedForEvent(uint256 _eventId, address _address) external view onlyResaleContract() returns (uint256) {
        return customerTotalSeatsPurchased[_eventId][_address];
    }

    /// @dev Increments the tickets/seats purchased counter for a particular address for an event if caller is the resale contract address
    function incrementCustomerTicketCount(uint256 _eventId, address _address) public onlyResaleContract() {
        customerTotalSeatsPurchased[_eventId][_address] += 1;
    }

    /// @dev Transfers the ownership of an NFT ticket token from the old owner to a new owner if caller is the resale contract address
    function transferTicket(address _oldOwner, address _newOwner, uint256 _ticketId) external onlyResaleContract() {
        NFTData memory nft = tokenIdToNFTData[_ticketId];
        require(nft.usedStatus == false, "Event ticket must not already have been used!");
        transferFrom(_oldOwner, _newOwner, _ticketId);
        // Set seat number owner
        ticketOwner[nft.eventId][nft.seatNr] = _newOwner;
        // Add seat number to tickets purchased by user pr event, and remove from old user
        customerTicketsPerEvent[nft.eventId][_newOwner].push(nft.seatNr);
        removeSeatFromArray(nft.eventId, _oldOwner, nft.seatNr);
        // Add NFT data to address mapping
        customerNFTs[_newOwner].push(_ticketId);
        removeTicketIdFromArray(_oldOwner, _ticketId);
    }

    /// @dev Removes a seat number from the array of tickets purchased by a customer for a particular event
    function removeSeatFromArray(uint256 _eventId, address _oldOwner, uint256 _seatNr) internal {
        uint256 length = customerTicketsPerEvent[_eventId][_oldOwner].length;
        for (uint256 i = 0; i < length; i++) {
            if (customerTicketsPerEvent[_eventId][_oldOwner][i] == _seatNr) {
                if (i != length - 1) {
                    customerTicketsPerEvent[_eventId][_oldOwner][i] = customerTicketsPerEvent[_eventId][_oldOwner][length - 1];
                }
                customerTicketsPerEvent[_eventId][_oldOwner].pop();
                return;
            }
        }
    }

    /// @dev Removes the ticket ID from the array of NFT ticket tokens owned by a customer
    function removeTicketIdFromArray(address _oldOwner, uint256 _ticketId) internal {
        uint256 length = customerNFTs[_oldOwner].length;
        for (uint256 i = 0; i < length; i++) {
            if (customerNFTs[_oldOwner][i] == _ticketId) {       
                if (i != length - 1) {
                    customerNFTs[_oldOwner][i] = customerNFTs[_oldOwner][length - 1];
                }
                customerNFTs[_oldOwner].pop();
                return;
            }
        }
    }

    /// @dev Overrides the ERC721 _update function which is called during every token transfer
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        // Transactions should only be done during minting or by the resale or register contract addresses
        if (_ownerOf(tokenId) != address(0)) {
            require(msg.sender == _resaleContractAddress || msg.sender == _registerContractAddress, "Only the resale and register contracts can transfer tokens!");
        }
        return super._update(to, tokenId, auth);
    }

    /// @dev Registers an NFT ticket token by validating the outputs of the owner’s private key signature, setting the ticket usedStatus to true, and burning the NFT token ID, if caller is the register contract address.
    function registerTicket(uint256 _eventId, uint256 _ticketId, bytes32 _messageHash, bytes32 _r, bytes32 _s, uint8 _v, address _organizer) external onlyRegisterContract() {
        NFTData memory ticket = tokenIdToNFTData[_ticketId];
        address seatOwner = ticketOwner[_eventId][ticket.seatNr];
        EventVenue memory eventVenue = eventVenues[_eventId];
        bool verifyResult = verifySignature(seatOwner, _messageHash, _r, _s, _v);
        require(eventVenue.venueOwner == _organizer, "Event organizer must also be the event venue owner!");
        require(verifyResult, "The hashed message was not signed by the seat owner!");
        require(ticket.usedStatus == false, "Event ticket must not already have been used!");
        tokenIdToNFTData[_ticketId].usedStatus = true;
        burn(_ticketId);
    }

    /// Adapted from ChainSafe Systems verify.sol VerifyMessage function: https://blog.chainsafe.io/how-to-verify-a-signed-message-in-solidity/?gi=7129bfe60178 (Accessed: 30-10-2023)
    /// @dev Verifies the outputs of the owner’s private key signature and returns a boolean
    function verifySignature(address _signerAddress, bytes32 _messageHash, bytes32 _r, bytes32 _s, uint8 _v) internal pure returns (bool) {
        bytes32 signedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _messageHash));
        address signerAddress = ecrecover(signedMessageHash, _v, _r, _s);
        return signerAddress == _signerAddress;
    }

    /// @notice Returns the usedStatus of a particular ticket token ID if caller has role ORGANIZER_ROLE
    function getTicketUsedStatus(uint256 _ticketId) external view onlyOrganizer() returns(bool) {
        return tokenIdToNFTData[_ticketId].usedStatus;
    }

    /// @dev Sets the owner of an event venue to a given address if caller has role DEFAULT_ADMIN_ROLE
    function setEventVenueOwner(uint256 _eventId, address _owner) external onlyAdmin() {
        eventVenues[_eventId].venueOwner = _owner;
    }
}