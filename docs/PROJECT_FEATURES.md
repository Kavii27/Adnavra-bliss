# ADNAVRA Project Features

This project is a salon and beauty marketplace platform for Sri Lanka. It connects customers with local beauty businesses, helps salon owners manage bookings and services, and gives platform admins a way to oversee businesses and subscriptions.

## 1. Customer marketplace

### Public home page
- Landing page for the ADNAVRA marketplacewww
- Shows featured and newly added salons
- Displays salons by category and city
- Includes search and discovery tools for finding local beauty services

### Search and discovery
- Search bar for discovering salons and services
- Category-based browsing
- City-based browsing for Sri Lankan locations
- Advanced filtering for local service discovery
- “Near you” and recommendation sections

### Salon profile pages
- Public business pages for each salon
- Business name, location, contact info, website, and gallery
- Opening hours and business status (open/closed)
- Service categories and price information
- Booking entry point from the business page

### Booking flow
- Customers can open a salon and book appointments
- Service listing and booking form for each business
- Booking pages are scoped to the specific salon and business
- Appointment scheduling is handled through the business booking flow

---

## 2. Business owner tools

### Dashboard
- Business owners get a dedicated dashboard area
- Overview of today’s bookings and next appointments
- Quick navigation to calendar, sales, and clients areas
- Business-scoped access so data stays tied to the correct salon

### Calendar and booking management
- Calendar views for managing appointments
- Booking records are displayed by business and date
- Staff and service data are associated with bookings
- Owners can review upcoming appointments and daily operations

### Service management
- Businesses can define service offerings
- Service data includes category, pricing, and duration
- Business-specific service catalogs are exposed on the public profile pages

### Client management
- Business owners can review customer-facing booking activity
- Client and booking information are organized within the dashboard

### Settings and onboarding
- Business configuration and setup flows for salon profiles
- Profile-related data such as location details, business info, and branding details
- Onboarding support for creating and configuring a business

---

## 3. Admin platform management

### Platform console
- Admin-only dashboard for the overall platform
- Displays counts of salons, services, and owner accounts
- Allows administrators to oversee the marketplace at a high level

### Business management
- Admins can add and manage salon businesses
- Owner account setup is linked to each business
- Business profiles, services, and photos can be managed from the platform side

### Subscription management
- Admins can assign subscription plans to businesses
- Includes tiers such as Starter, Professional, and Premium
- Premium-level businesses can be marked as featured

---

## 4. Authentication and access control

- Role-based access for customers, business owners, and admins
- Auth system built around Next.js and NextAuth
- Secure login and session handling
- Internal route protection for business and admin areas
- Additional business-level checks inside route handlers for ownership safety

---

## 5. Data and application quality

### Database and validation
- Prisma is used for the main application database
- Zod validation is used for forms and API requests
- Business data is kept scoped by business ownership rules

### Security-focused patterns
- Password hashing via bcrypt utility through a central password helper
- Input validation before database writes
- Rate limiting for public-facing mutating form submissions
- Safety around business data access and mutation flows

### Testing
- Availability and booking logic tests are included in the project
- The app includes validation around scheduling and conflict prevention

---

## 6. Content and marketing pages

- Marketing pages for the business brand and product positioning
- About, contact, pricing, help, privacy, and terms pages
- Business-focused pages for onboarding and partner conversion
- Blog and informational content areas

---

## 7. Overall product goal

ADNAVRA is positioned as a Sri Lanka-based self-care marketplace that lets customers discover and book salon services while giving local business owners a clean operational dashboard and giving admins control over the platform’s businesses and subscriptions.

This is a current snapshot of the features present in the codebase and product flow today.
