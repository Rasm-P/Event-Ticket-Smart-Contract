const { expect } = require("chai");
const hre = require("hardhat");

const CONTRACT_NAME = "TicketContract";
const CONTRACT_SYMBOL = "TC";
const EVENT_NAME = "Test";
const EVENT_DESCRIPTION = "This is a test";
const NUMBER_OF_TICKETS = 10;
const EVENT_LOCATION = "Copenhagen, Denmark";
const EVENT_DATE = "Dec 3, 2023";
const EVENT_TIME = "3:00PM to 8:00PM";
const TICKET_PRICE = hre.ethers.parseEther("0.05");
const TICKETS_PR_CUSTOMER = 3;
const IMAGE_URL = "https://Test";

describe("TicketContract", () => {
    let customer;
    let secondCustomer;
    let promoteAccount;
    let organizerAdmin;
    let tokenContractAddress;
    let resaleContractAddress;
    let registerContractAddress;
    let contract;

    before(async () => {
        [
            customer,
            secondCustomer,
            promoteAccount,
            organizerAdmin,
            resaleContractAddress,
            registerContractAddress,
        ] = await hre.ethers.getSigners();
        const TicketContract = await hre.ethers.getContractFactory(
            "TicketContract",
            organizerAdmin
        );
        contract = await TicketContract.deploy(CONTRACT_NAME, CONTRACT_SYMBOL);
        tokenContractAddress = await contract.getAddress();
        await contract
            .connect(organizerAdmin)
            .setResaleContract(resaleContractAddress);
        await contract
            .connect(organizerAdmin)
            .setRegisterContract(registerContractAddress);
        await contract.connect(customer).setContractApprovals();
        await contract.connect(secondCustomer).setContractApprovals();
        await contract
            .connect(organizerAdmin)
            .addEvent(
                EVENT_NAME,
                EVENT_DESCRIPTION,
                NUMBER_OF_TICKETS,
                EVENT_LOCATION,
                EVENT_DATE,
                EVENT_TIME,
                TICKET_PRICE,
                TICKETS_PR_CUSTOMER,
                IMAGE_URL
            );
    });

    describe("Test access control", () => {
        it("Resale and Register contracts are approved", async () => {
            const customerApproval = await contract
                .connect(customer)
                .areContractsApproved();
            const secondCustomerApproval = await contract
                .connect(secondCustomer)
                .areContractsApproved();
            expect(customerApproval).to.equal(true);
            expect(secondCustomerApproval).to.equal(true);
        });

        it("Customer cannot call add event", async () => {
            await expect(
                contract
                    .connect(customer)
                    .addEvent(
                        EVENT_NAME,
                        EVENT_DESCRIPTION,
                        NUMBER_OF_TICKETS,
                        EVENT_LOCATION,
                        EVENT_DATE,
                        EVENT_TIME,
                        TICKET_PRICE,
                        TICKETS_PR_CUSTOMER,
                        IMAGE_URL
                    )
            ).to.rejectedWith("Only organizers can call this function!");
        });

        it("Admin can promote account to organizer", async () => {
            await contract
                .connect(organizerAdmin)
                .promoteToOrganizer(promoteAccount);
            const role = await contract
                .connect(organizerAdmin)
                .getAccessRole(promoteAccount);

            expect(role).to.equal("Organizer");
        });

        it("Customer or organizers cannot promote others", async () => {
            await expect(
                contract.connect(secondCustomer).promoteToOrganizer(customer)
            ).to.revertedWith("Only admins can call this function!");
            await expect(
                contract.connect(customer).promoteToOrganizer(secondCustomer)
            ).to.rejectedWith("Only admins can call this function!");
        });
    });

    describe("Smart contract deployment", () => {
        it("Contract name and symbol is as expected", async () => {
            const name = await contract.connect(organizerAdmin).name();
            const symbol = await contract.connect(organizerAdmin).symbol();

            expect(name).to.equal(CONTRACT_NAME);
            expect(symbol).to.equal(CONTRACT_SYMBOL);
        });

        it("Deployer is the contract admin", async () => {
            const contractAdmin = await contract.contractAdmin();

            expect(contractAdmin).to.equal(organizerAdmin.address);
        });
    });

    describe("Manage event venues", () => {
        it("Can fetch all events", async () => {
            const events = await contract.getAllEvents();
            const event = events[0];

            expect(events.length).to.equal(1);
            expect(event["id"]).to.equal(0);
            expect(event["eventName"]).to.equal(EVENT_NAME);
            expect(event["eventDescription"]).to.equal(EVENT_DESCRIPTION);
            expect(event["numberOfTickets"]).to.equal(NUMBER_OF_TICKETS);
            expect(event["ticketsLeft"]).to.equal(NUMBER_OF_TICKETS);
            expect(event["eventLocation"]).to.equal(EVENT_LOCATION);
            expect(event["eventDate"]).to.equal(EVENT_DATE);
            expect(event["eventTime"]).to.equal(EVENT_TIME);
            expect(event["ticketPrice"]).to.equal(TICKET_PRICE);
            expect(event["ticketsPrCustomer"]).to.equal(TICKETS_PR_CUSTOMER);
            expect(event["imageUrl"]).to.equal(IMAGE_URL);
        });

        it("Can fetch individual event by ID", async () => {
            const event = await contract.getEventById(0);

            expect(event["id"]).to.equal(0);
            expect(event["eventName"]).to.equal(EVENT_NAME);
            expect(event["eventDescription"]).to.equal(EVENT_DESCRIPTION);
            expect(event["numberOfTickets"]).to.equal(NUMBER_OF_TICKETS);
            expect(event["ticketsLeft"]).to.equal(NUMBER_OF_TICKETS);
            expect(event["eventLocation"]).to.equal(EVENT_LOCATION);
            expect(event["eventDate"]).to.equal(EVENT_DATE);
            expect(event["eventTime"]).to.equal(EVENT_TIME);
            expect(event["ticketPrice"]).to.equal(TICKET_PRICE);
            expect(event["ticketsPrCustomer"]).to.equal(TICKETS_PR_CUSTOMER);
            expect(event["imageUrl"]).to.equal(IMAGE_URL);
        });
    });

    describe("Purchase tickets", () => {
        const EVENT_ID = 0;
        const SEAT_NUMBER = 5;

        before(async () => {
            await contract
                .connect(customer)
                .purchaseTicket(EVENT_ID, [SEAT_NUMBER], {
                    value: TICKET_PRICE,
                });
        });

        it("Number of tickets for tickets has changed", async () => {
            const event = await contract
                .connect(customer)
                .getEventById(EVENT_ID);

            expect(event.ticketsLeft).to.equal(NUMBER_OF_TICKETS - 1);
        });

        it("Smart contract balance has changed", async () => {
            const balance = await hre.ethers.provider.getBalance(
                tokenContractAddress
            );

            expect(balance).to.equal(TICKET_PRICE);
        });

        it("That event ID does not exist", async () => {
            await expect(
                contract
                    .connect(secondCustomer)
                    .purchaseTicket(99, [1], { value: TICKET_PRICE })
            ).to.rejectedWith("That event ID does not exist!");
        });

        it("Sold seats list has changed", async () => {
            const soldSeats = await contract.getSeatsSoldForEvent(EVENT_ID);

            expect(soldSeats.length).to.equal(1);
            expect(soldSeats[0]).to.equal(SEAT_NUMBER);
        });

        it("Customer tickets for event has changed", async () => {
            const customerTickets = await contract
                .connect(customer)
                .getCustomerTicketsForEvent(0);

            expect(customerTickets.length).to.equal(1);
            expect(customerTickets[0]).to.equal(SEAT_NUMBER);
        });

        it("Customer can buy multiple tickets", async () => {
            const OTHER_SEAT_NUMBERS = [1, 2, 3];
            const value = TICKET_PRICE * BigInt(OTHER_SEAT_NUMBERS.length);
            await contract
                .connect(secondCustomer)
                .purchaseTicket(EVENT_ID, OTHER_SEAT_NUMBERS, {
                    value: value,
                });
            const customerTickets = await contract
                .connect(secondCustomer)
                .getCustomerTicketsForEvent(0);

            expect(customerTickets.length).to.equal(OTHER_SEAT_NUMBERS.length);
        });

        it("Value cannot be lower than price", async () => {
            await expect(
                contract
                    .connect(secondCustomer)
                    .purchaseTicket(EVENT_ID, [1], { value: 1 })
            ).to.rejectedWith("Value cannot be lower than price!");
        });

        it("Cannot purchase more tickets than there are seats left", async () => {
            const ALL_THE_SEATS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const value = TICKET_PRICE * BigInt(ALL_THE_SEATS.length);

            await expect(
                contract
                    .connect(secondCustomer)
                    .purchaseTicket(EVENT_ID, ALL_THE_SEATS, {
                        value: value,
                    })
            ).to.rejectedWith(
                "Cannot purchase more tickets than there are seats left!"
            );
        });

        it("Cannot purchase more tickets than the event limit", async () => {
            await expect(
                contract.connect(secondCustomer).purchaseTicket(EVENT_ID, [7], {
                    value: TICKET_PRICE,
                })
            ).to.rejectedWith(
                "Cannot purchase more tickets than the event limit!"
            );
        });

        it("Cannot pick seats that are not part of the event", async () => {
            await expect(
                contract.connect(customer).purchaseTicket(EVENT_ID, [99], {
                    value: TICKET_PRICE,
                })
            ).to.rejectedWith(
                "Cannot pick seats that are not part of the event!"
            );
        });

        it("Can only purchase a seat that is not already owned", async () => {
            await expect(
                contract
                    .connect(customer)
                    .purchaseTicket(EVENT_ID, [SEAT_NUMBER], {
                        value: TICKET_PRICE,
                    })
            ).to.rejectedWith(
                "Can only purchase a seat that is not already owned!"
            );
        });

        it("Can fetch sender NFT ticket data", async () => {
            const senderNFTs = await contract
                .connect(secondCustomer)
                .getSenderNFTs();

            expect(senderNFTs.length).to.equal(3);
            expect(senderNFTs[0]["tokenId"]).to.equal(1);
            expect(senderNFTs[0]["eventId"]).to.equal(0);
            expect(senderNFTs[0]["seatNr"]).to.equal(1);
            expect(senderNFTs[1]["tokenId"]).to.equal(2);
            expect(senderNFTs[1]["eventId"]).to.equal(0);
            expect(senderNFTs[1]["seatNr"]).to.equal(2);
            expect(senderNFTs[2]["tokenId"]).to.equal(3);
            expect(senderNFTs[2]["eventId"]).to.equal(0);
            expect(senderNFTs[2]["seatNr"]).to.equal(3);
        });
    });

    describe("Withdraw funds", () => {
        let adminBalanceBefore;
        let contractBalanceBefore;

        before(async () => {
            contractBalanceBefore = await hre.ethers.provider.getBalance(
                tokenContractAddress
            );
            adminBalanceBefore = await hre.ethers.provider.getBalance(
                organizerAdmin.address
            );
            await contract.connect(customer).purchaseTicket(0, [4], {
                value: TICKET_PRICE,
            });
            await contract.connect(organizerAdmin).withdrawContractFunds();
        });

        it("Customer or organizers cannot withdraw from contract", async () => {
            await expect(
                contract.connect(secondCustomer).withdrawContractFunds()
            ).to.rejectedWith("Only admins can call this function!");
            await expect(
                contract.connect(customer).withdrawContractFunds()
            ).to.rejectedWith("Only admins can call this function!");
        });

        it("Admin balance updated", async () => {
            const balanceAfter = await hre.ethers.provider.getBalance(
                organizerAdmin.address
            );

            expect(balanceAfter).to.greaterThan(adminBalanceBefore);
        });

        it("Contract balance empty", async () => {
            const contractBalanceAfter = await hre.ethers.provider.getBalance(
                tokenContractAddress
            );

            expect(contractBalanceBefore).to.greaterThan(0);
            expect(contractBalanceAfter).to.equal(0);
        });
    });

    describe("Token transactions", () => {
        const TICKET_ID = 0;

        it("Customer may not transfer ticket tokens to another customer", async () => {
            await expect(
                contract
                    .connect(customer)
                    .transferFrom(
                        customer.address,
                        secondCustomer.address,
                        TICKET_ID
                    )
            ).to.rejectedWith(
                "Only the resale and register contracts can transfer tokens!"
            );
        });

        it("ResaleContractAddress may transfer ticket tokens", async () => {
            await contract
                .connect(resaleContractAddress)
                .transferFrom(customer, secondCustomer, TICKET_ID);
            const owner = await contract.ownerOf(TICKET_ID);

            expect(owner).to.equal(secondCustomer.address);
            expect(owner).not.to.equal(customer.address);
        });
    });

    describe("Transfer ticket from old to new owner", () => {
        const EVENT_ID = 0;
        const TICKET_ID = 1;
        let ownerOfSeatBefore;
        let customerTicketsBefore;
        let customerNFTsBefore;

        before(async () => {
            ownerOfSeatBefore = await contract
                .connect(organizerAdmin)
                .getOwnerOfSeat(EVENT_ID, TICKET_ID);
            customerTicketsBefore = await contract
                .connect(secondCustomer)
                .getCustomerTicketsForEvent(EVENT_ID);
            customerNFTsBefore = await contract
                .connect(secondCustomer)
                .getSenderNFTs();
            await contract
                .connect(resaleContractAddress)
                .transferTicket(secondCustomer.address, customer.address, 1);
        });

        it("Seat owner has changed", async () => {
            const ownerOfSeatAfter = await contract
                .connect(organizerAdmin)
                .getOwnerOfSeat(EVENT_ID, TICKET_ID);

            expect(ownerOfSeatBefore).not.to.equal(ownerOfSeatAfter);
            expect(ownerOfSeatAfter).to.equal(customer.address);
        });

        it("Customer tickets has updated", async () => {
            const customerTicketsAfter = await contract
                .connect(secondCustomer)
                .getCustomerTicketsForEvent(EVENT_ID);

            expect(customerTicketsBefore.length - 1).to.equal(
                customerTicketsAfter.length
            );
            expect(customerTicketsAfter).not.to.contain(
                customerTicketsBefore[0]
            );
        });

        it("Customer NFTs has updated", async () => {
            const customerNFTsAfter = await contract
                .connect(secondCustomer)
                .getSenderNFTs();

            expect(customerNFTsBefore.length - 1).to.equal(
                customerNFTsAfter.length
            );
            expect(customerNFTsAfter).not.to.contain(customerNFTsBefore[0]);
        });
    });

    describe("Change event venue owner", () => {
        const EVENT_ID = 0;
        let eventBefore;

        before(async () => {
            eventBefore = await contract.getEventById(EVENT_ID);
        });

        it("Contract admin can set a new event venue owner", async () => {
            await contract
                .connect(organizerAdmin)
                .setEventVenueOwner(EVENT_ID, customer.address);
            const eventAfter = await contract.getEventById(EVENT_ID);

            expect(eventAfter.venueOwner).not.to.equal(eventBefore.venueOwner);
            expect(eventAfter.venueOwner).to.equal(customer.address);
        });
    });
});
