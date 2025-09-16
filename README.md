# Cinema Tickets – NodeJS Assessment

This repository contains the implementation of the `TicketService` for the Cinema Tickets coding exercise.  
It enforces all business rules, validates requests, and integrates with the provided third-party services (`TicketPaymentService` and `SeatReservationService`).

---

## 🚀 How to Run Tests

The project uses [Jest](https://jestjs.io/) for testing.

```bash
# install dependencies
npm install

# run the tests
npm test
```
````

---

## 📂 Project Structure

```
.
├── src/
│   ├── pairtest/
│   │   ├── lib/            # Provided immutable TicketTypeRequest & exceptions
│   │   └── TicketService.js     # Implementation of TicketService
│   └── thirdparty/         # Provided external services (not modifiable)
├── tests/
│   └── TicketService.test.js # Comprehensive test suite
├── package.json
├── README.md
└── .gitignore
```

---

## ✅ Tests

The test suite (`tests/TicketService.test.js`) covers:

- Valid purchases (single adult, mixed tickets, edge cases).
- Invalid purchases (invalid accountId, >25 tickets, infants > adults, children/infants without adult).
- Order of operations (payment before seat reservation).
- Ensures external services are not called on invalid requests.
