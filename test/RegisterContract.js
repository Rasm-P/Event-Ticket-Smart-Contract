const { expect } = require("chai");
const hre = require("hardhat");
const { createHash } = require("crypto");

const TICKET_CONTRACT_NAME = "TicketContract";
const TICKET_CONTRACT_SYMBOL = "TC";
const EVENT_NAME = "Test";
const EVENT_DESCRIPTION = "This is a test";
const NUMBER_OF_TICKETS = 10;
const EVENT_LOCATION = "Copenhagen, Denmark";
const EVENT_DATE = "Dec 3, 2023";
const EVENT_TIME = "3:00PM to 8:00PM";
const TICKET_PRICE = hre.ethers.parseEther("0.05");
const TICKETS_PR_CUSTOMER = 4;
const IMAGE_URL = "https://Test";
const EVENT_ID = 0;
const SEAT_NUMBER = 0;

describe("RegisterContract", () => {
    let customer;
    let secondCustomer;
    let organizer;
    let secondOrganizer;
    let contractAdmin;
    let ticketContract;
    let resaleContract;
    let registerContract;
    let tokenContractAddress;
    let resaleContractAddress;
    let registerContractAddress;

    before(async () => {
        [customer, secondCustomer, organizer, secondOrganizer, contractAdmin] =
            await hre.ethers.getSigners();
        const ResaleContract = await hre.ethers.getContractFactory(
            "ResaleContract",
            contractAdmin
        );
        resaleContract = await ResaleContract.deploy();
        resaleContractAddress = await resaleContract.getAddress();
        const TicketContract = await hre.ethers.getContractFactory(
            "TicketContract",
            contractAdmin
        );
        ticketContract = await TicketContract.deploy(
            TICKET_CONTRACT_NAME,
            TICKET_CONTRACT_SYMBOL
        );
        tokenContractAddress = await ticketContract.getAddress();
        const RegisterContract = await hre.ethers.getContractFactory(
            "RegisterContract",
            contractAdmin
        );
        registerContract = await RegisterContract.deploy();
        registerContractAddress = await registerContract.getAddress();
        await resaleContract
            .connect(contractAdmin)
            .setTicketContractAddress(tokenContractAddress);
        await registerContract
            .connect(contractAdmin)
            .setTicketContractAddress(tokenContractAddress);
        await ticketContract
            .connect(contractAdmin)
            .setResaleContract(resaleContractAddress);
        await ticketContract
            .connect(contractAdmin)
            .setRegisterContract(registerContractAddress);
        await ticketContract
            .connect(contractAdmin)
            .promoteToOrganizer(organizer);
        await ticketContract
            .connect(contractAdmin)
            .promoteToOrganizer(secondOrganizer);
        await ticketContract.connect(customer).setContractApprovals();
        await ticketContract.connect(secondCustomer).setContractApprovals();
        await ticketContract
            .connect(organizer)
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
        for (let i = 0; i < 3; i++) {
            await ticketContract
                .connect(customer)
                .purchaseTicket(EVENT_ID, [SEAT_NUMBER + i], {
                    value: TICKET_PRICE,
                });
        }
    });

    describe("Event ticket registration", () => {
        const TICKET_ID = 0;
        const MESSAGE = "Test";
        let hashedMessage;
        let customerSignature;
        let secondCustomerSignature;

        before(async () => {
            hashedMessage = new Uint8Array(
                createHash("sha256").update(MESSAGE).digest()
            );
            const signedMessage = await customer.signMessage(hashedMessage);
            customerSignature = hre.ethers.Signature.from(signedMessage);
            const secondSignedMessage = await secondCustomer.signMessage(
                hashedMessage
            );
            secondCustomerSignature =
                hre.ethers.Signature.from(secondSignedMessage);
        });

        it("Only the RegisterContract address can call the TicketContract registerTicket function", async () => {
            await expect(
                ticketContract
                    .connect(customer)
                    .registerTicket(
                        EVENT_ID,
                        TICKET_ID,
                        hashedMessage,
                        customerSignature.r,
                        customerSignature.s,
                        customerSignature.v,
                        customer.address
                    )
            ).to.rejectedWith(
                "Address should equal register contract address!"
            );
        });

        it("Only organizers can register event tickets using the RegisterContract", async () => {
            await expect(
                registerContract
                    .connect(customer)
                    .registerTicket(
                        EVENT_ID,
                        TICKET_ID,
                        hashedMessage,
                        customerSignature.r,
                        customerSignature.s,
                        customerSignature.v
                    )
            ).to.rejectedWith("Only organizers can call this function!");
        });

        it("Event organizer must also be the event venue owner", async () => {
            await expect(
                registerContract
                    .connect(secondOrganizer)
                    .registerTicket(
                        EVENT_ID,
                        TICKET_ID,
                        hashedMessage,
                        customerSignature.r,
                        customerSignature.s,
                        customerSignature.v
                    )
            ).to.rejectedWith(
                "Event organizer must also be the event venue owner!"
            );
        });

        it("The hashed message was not signed by the seat owner", async () => {
            await expect(
                registerContract
                    .connect(organizer)
                    .registerTicket(
                        EVENT_ID,
                        TICKET_ID,
                        hashedMessage,
                        secondCustomerSignature.r,
                        secondCustomerSignature.s,
                        secondCustomerSignature.v
                    )
            ).to.rejectedWith(
                "The hashed message was not signed by the seat owner!"
            );
        });

        it("Register event ticket", async () => {
            const statusBefore = await ticketContract.getTicketUsedStatus(
                TICKET_ID
            );
            await registerContract
                .connect(organizer)
                .registerTicket(
                    EVENT_ID,
                    TICKET_ID,
                    hashedMessage,
                    customerSignature.r,
                    customerSignature.s,
                    customerSignature.v
                );
            const statusAfter = await ticketContract.getTicketUsedStatus(
                TICKET_ID
            );

            expect(statusBefore).to.equal(false);
            expect(statusAfter).to.equal(true);
        });

        it("Event ticket must not already have been used", async () => {
            await expect(
                registerContract
                    .connect(organizer)
                    .registerTicket(
                        EVENT_ID,
                        TICKET_ID,
                        hashedMessage,
                        customerSignature.r,
                        customerSignature.s,
                        customerSignature.v
                    )
            ).to.rejectedWith("Event ticket must not already have been used!");
        });
    });

    describe("Event ticket invalidation after registration", async () => {
        const MESSAGE = "Test";
        const TICKET_ID = 1;
        let customerNFTsBefore;
        let seatsSoldBefore;
        let customerTicketsBefore;
        let ownerOfSeatBefore;

        before(async () => {
            customerNFTsBefore = await ticketContract
                .connect(customer)
                .getSenderNFTs();
            seatsSoldBefore = await ticketContract.getSeatsSoldForEvent(
                EVENT_ID
            );
            customerTicketsBefore = await ticketContract
                .connect(customer)
                .getCustomerTicketsForEvent(EVENT_ID);
            ownerOfSeatBefore = await ticketContract
                .connect(organizer)
                .getOwnerOfSeat(EVENT_ID, SEAT_NUMBER + 1);
            const hashedMessage = new Uint8Array(
                createHash("sha256").update(MESSAGE).digest()
            );
            const signedMessage = await customer.signMessage(hashedMessage);
            const customerSignature = hre.ethers.Signature.from(signedMessage);
            await registerContract
                .connect(organizer)
                .registerTicket(
                    EVENT_ID,
                    TICKET_ID,
                    hashedMessage,
                    customerSignature.r,
                    customerSignature.s,
                    customerSignature.v
                );
        });

        it("Registered ticket should be marked as already used", async () => {
            const status = await ticketContract.getTicketUsedStatus(TICKET_ID);

            expect(status).to.equal(true);
        });

        it("Ticket token id should be invalid after registration burn", async () => {
            await expect(ticketContract.ownerOf(TICKET_ID)).to.rejectedWith(
                "ERC721NonexistentToken(1)"
            );
        });

        it("Customer cannot purchase a seat that has already been registered", async () => {
            await expect(
                ticketContract
                    .connect(customer)
                    .purchaseTicket(EVENT_ID, [SEAT_NUMBER + 1], {
                        value: TICKET_PRICE,
                    })
            ).to.rejectedWith(
                "Can only purchase a seat that is not already owned!"
            );
        });

        it("Customer cannot resell ticket that has already been registered", async () => {
            await expect(
                resaleContract
                    .connect(customer)
                    .listTicketForSale(TICKET_ID, TICKET_PRICE)
            ).to.rejectedWith("ERC721NonexistentToken(1)");
        });

        it("Customer NFTs should be marked as used", async () => {
            const customerNFTsAfter = await ticketContract
                .connect(customer)
                .getSenderNFTs();

            const before = customerNFTsBefore[TICKET_ID];
            expect(before.tokenId).to.equal(TICKET_ID);
            expect(before.eventId).to.equal(EVENT_ID);
            expect(before.seatNr).to.equal(TICKET_ID);
            expect(before.usedStatus).to.equal(false);

            const after = customerNFTsAfter[TICKET_ID];
            expect(after.tokenId).to.equal(TICKET_ID);
            expect(after.eventId).to.equal(EVENT_ID);
            expect(after.seatNr).to.equal(TICKET_ID);
            expect(after.usedStatus).to.equal(true);
        });

        it("Seats sold for event should remain unchanged", async () => {
            const seatsSoldAfter = await ticketContract.getSeatsSoldForEvent(
                EVENT_ID
            );

            expect(seatsSoldBefore).to.deep.equal(seatsSoldAfter);
        });

        it("Customer seats for event should remain unchanged", async () => {
            const customerTicketsAfter = await ticketContract
                .connect(customer)
                .getCustomerTicketsForEvent(EVENT_ID);

            expect(customerTicketsBefore).to.deep.equal(customerTicketsAfter);
        });

        it("Owner of seat should remain unchanged", async () => {
            const ownerOfSeatAfter = await ticketContract
                .connect(organizer)
                .getOwnerOfSeat(EVENT_ID, SEAT_NUMBER + 1);

            expect(ownerOfSeatBefore).to.deep.equal(ownerOfSeatAfter);
        });
    });

    describe("Event ticket registration after resale", async () => {
        const MESSAGE = "Test";
        TICKET_ID = 2;
        LISTING_ID = 0;

        before(async () => {
            await resaleContract
                .connect(customer)
                .listTicketForSale(TICKET_ID, TICKET_PRICE);
            await resaleContract
                .connect(secondCustomer)
                .purchaseTicketFromResale(LISTING_ID, {
                    value: TICKET_PRICE,
                });
        });

        it("Ticket bought from resale can be registered", async () => {
            const hashedMessage = new Uint8Array(
                createHash("sha256").update(MESSAGE).digest()
            );
            const signedMessage = await secondCustomer.signMessage(
                hashedMessage
            );
            const customerSignature = hre.ethers.Signature.from(signedMessage);
            await registerContract
                .connect(organizer)
                .registerTicket(
                    EVENT_ID,
                    TICKET_ID,
                    hashedMessage,
                    customerSignature.r,
                    customerSignature.s,
                    customerSignature.v
                );
            const status = await ticketContract.getTicketUsedStatus(TICKET_ID);

            expect(status).to.equal(true);
        });
    });
});
