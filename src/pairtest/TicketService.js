import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";

export default class TicketService {
  constructor(
    paymentService = new TicketPaymentService(),
    seatService = new SeatReservationService()
  ) {
    this._paymentService = paymentService;
    this._seatService = seatService;
  }

  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validateAccountId(accountId);
    this.#validateRequests(ticketTypeRequests);

    const { adultCount, childCount, infantCount } =
      this.#countTickets(ticketTypeRequests);

    // Business Rules Validation
    const totalTickets = adultCount + childCount + infantCount;
    if (totalTickets === 0) {
      throw new InvalidPurchaseException(
        "At least one ticket must be purchased"
      );
    }

    if (totalTickets > 25) {
      throw new InvalidPurchaseException(
        "Cannot purchase more than 25 tickets at a time"
      );
    }

    if ((childCount > 0 || infantCount > 0) && adultCount === 0) {
      throw new InvalidPurchaseException(
        "Child and Infant tickets require at least one Adult ticket"
      );
    }

    if (infantCount > adultCount) {
      throw new InvalidPurchaseException(
        "Each infant must be accompanied by an adult (infants <= adults)"
      );
    }

    const totalAmountToPay = this.#calculateAmount(adultCount, childCount);
    const totalSeatsToAllocate = this.#calculateSeats(adultCount, childCount);

    // make payment first, then reserve seats
    this._paymentService.makePayment(accountId, totalAmountToPay);
    this._seatService.reserveSeat(accountId, totalSeatsToAllocate);
  }

  // ---------- Private helpers ----------

  /**
   * Validates the account ID.
   * @param {*} accountId
   */
  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException("accountId must be an integer > 0");
    }
  }

  /**
   * Validates the ticket type requests.
   * @param {*} requests
   */
  #validateRequests(requests) {
    if (!requests || requests.length === 0) {
      throw new InvalidPurchaseException("No ticket requests provided");
    }

    for (const req of requests) {
      if (!(req instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException(
          "Each request must have a type and number of tickets"
        );
      }
      const n = req.getNoOfTickets();
      if (!Number.isInteger(n) || n < 0) {
        throw new InvalidPurchaseException(
          "ticket counts must be integers >= 0"
        );
      }
    }
  }

  /**
   * Counts the number of tickets of each type.
   * @param {*} requests
   * @returns { adultCount, childCount, infantCount }
   */
  #countTickets(requests) {
    let adultCount = 0;
    let childCount = 0;
    let infantCount = 0;

    for (const req of requests) {
      const type = req.getTicketType();
      const n = req.getNoOfTickets();
      if (type === "ADULT") adultCount += n;
      if (type === "CHILD") childCount += n;
      if (type === "INFANT") infantCount += n;
    }
    return { adultCount, childCount, infantCount };
  }

  /**
   * Calculates the total amount to pay.
   * @param {*} adultCount
   * @param {*} childCount
   * @returns total amount to pay
   */
  #calculateAmount(adultCount, childCount) {
    // Prices: ADULT £25, CHILD £15, INFANT £0
    const adultAmount = adultCount * 25;
    const childAmount = childCount * 15;
    const total = adultAmount + childAmount;
    if (!Number.isInteger(total)) {
      throw new InvalidPurchaseException(
        "calculated amount must be an integer"
      );
    }
    return total;
  }

  /**
   * Calculates the number of seats to allocate.
   * @param {*} adultCount
   * @param {*} childCount
   * @returns number of seats to allocate
   */
  #calculateSeats(adultCount, childCount) {
    // INFANT does not get a seat
    const seats = adultCount + childCount;
    if (!Number.isInteger(seats)) {
      throw new InvalidPurchaseException("calculated seats must be integer");
    }
    return seats;
  }
}
