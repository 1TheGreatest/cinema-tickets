import { jest } from "@jest/globals";
import TicketService from "../src/pairtest/TicketService.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException.js";

describe("TicketService", () => {
  let mockPayment;
  let mockSeat;
  let service;

  beforeEach(() => {
    mockPayment = { makePayment: jest.fn() };
    mockSeat = { reserveSeat: jest.fn() };
    service = new TicketService(mockPayment, mockSeat);
  });

  test("purchases 1 adult", () => {
    service.purchaseTickets(1, new TicketTypeRequest("ADULT", 1));
    expect(mockPayment.makePayment).toHaveBeenCalledWith(1, 25);
    expect(mockSeat.reserveSeat).toHaveBeenCalledWith(1, 1);
  });

  test("purchases 2 adults, 1 child, 1 infant", () => {
    service.purchaseTickets(
      2,
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("CHILD", 1),
      new TicketTypeRequest("INFANT", 1)
    );
    // totalAmount = 2*25 + 1*15 = 65
    expect(mockPayment.makePayment).toHaveBeenCalledWith(2, 65);
    // seats = adults + children = 3
    expect(mockSeat.reserveSeat).toHaveBeenCalledWith(2, 3);
  });

  test("allows multiple children with 1 adult", () => {
    service.purchaseTickets(
      3,
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("CHILD", 5)
    );
    expect(mockPayment.makePayment).toHaveBeenCalledWith(3, 25 + 5 * 15);
    expect(mockSeat.reserveSeat).toHaveBeenCalledWith(3, 6);
  });

  test("allows infants equal to adults", () => {
    service.purchaseTickets(
      4,
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("INFANT", 2)
    );
    // Infants free
    expect(mockPayment.makePayment).toHaveBeenCalledWith(4, 50);
    expect(mockSeat.reserveSeat).toHaveBeenCalledWith(4, 2);
  });

  test("calls payment before seat reservation", () => {
    service.purchaseTickets(1, new TicketTypeRequest("ADULT", 1));

    const paymentOrder = mockPayment.makePayment.mock.invocationCallOrder[0];
    const seatOrder = mockSeat.reserveSeat.mock.invocationCallOrder[0];
    expect(paymentOrder).toBeLessThan(seatOrder); // payment first
  });

  // INVALID PURCHASES

  test("throws when accountId <= 0", () => {
    expect(() =>
      service.purchaseTickets(0, new TicketTypeRequest("ADULT", 1))
    ).toThrow(InvalidPurchaseException);

    expect(mockPayment.makePayment).not.toHaveBeenCalled();
    expect(mockSeat.reserveSeat).not.toHaveBeenCalled();
  });

  test("throws when no tickets requested", () => {
    expect(() => service.purchaseTickets(5)).toThrow(InvalidPurchaseException);
  });

  test("throws when more than 25 tickets", () => {
    expect(() =>
      service.purchaseTickets(6, new TicketTypeRequest("ADULT", 26))
    ).toThrow(InvalidPurchaseException);
    expect(mockPayment.makePayment).not.toHaveBeenCalled();
  });

  test("throws when only children are requested without an adult", () => {
    expect(() =>
      service.purchaseTickets(7, new TicketTypeRequest("CHILD", 2))
    ).toThrow(InvalidPurchaseException);
  });

  test("throws when only infants are requested without an adult", () => {
    expect(() =>
      service.purchaseTickets(8, new TicketTypeRequest("INFANT", 1))
    ).toThrow(InvalidPurchaseException);
  });

  test("throws when infants exceed adults", () => {
    expect(() =>
      service.purchaseTickets(
        9,
        new TicketTypeRequest("ADULT", 1),
        new TicketTypeRequest("INFANT", 2)
      )
    ).toThrow(InvalidPurchaseException);
  });

  test("throws when ticket request is not a TicketTypeRequest instance", () => {
    expect(() =>
      service.purchaseTickets(1, { type: "ADULT", noOfTickets: 1 })
    ).toThrow(InvalidPurchaseException);
  });

  test("throws when ticket count is not an integer", () => {
    expect(() =>
      service.purchaseTickets(1, new TicketTypeRequest("ADULT", 1.5))
    ).toThrow(TypeError); // constructor of TicketTypeRequest already throws
  });
});
