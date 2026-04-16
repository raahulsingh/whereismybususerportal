# Where Is My Bus (Spring Boot + MySQL + JSP)

Real-time bus tracking system for MCA minor project.

## Features
- Driver endpoint to post GPS updates (`/api/driver/updateLocation`)
- Live buses API (`/api/buses/live`)
- Routes & stops APIs
- Minimal JSP UI with Google Maps showing live markers
- Simple API key auth for driver uploads

## Prerequisites
- JDK 17
- Maven 3.9+
- MySQL 8.x
- Google Maps JavaScript API key

## Setup
1. Create database & tables:
   ```sql
   -- db/schema.sql
   -- db/seed.sql
   ```
   Run:
   ```bash
   mysql -u root -p < db/schema.sql
   mysql -u root -p < db/seed.sql
   ```

2. Configure `src/main/resources/application.properties`:
   - Set `spring.datasource.username` / `spring.datasource.password`
   - Set `app.apiKey` (driver upload key)
   - Put your Maps key into `src/main/webapp/WEB-INF/views/index.jsp`

3. Run the app:
   ```bash
   mvn spring-boot:run
   ```
   Open http://localhost:8080/

4. Simulate driver pings:
   ```bash
   curl -X POST http://localhost:8080/api/driver/updateLocation      -H 'Content-Type: application/json'      -H 'X-API-KEY: CHANGE_ME_DRIVER_API_KEY'      -d '{"busCode":"BUS-101","lat":12.97240,"lng":77.59400,"speedKmph":18.5,"headingDeg":90}'
   ```

## Endpoints
- `POST /api/driver/updateLocation` — body: `{busCode, lat, lng, speedKmph?, headingDeg?}`
- `GET /api/buses/live?routeId?`
- `GET /api/routes`
- `GET /api/routes/{routeId}/stops`
- `GET /api/eta?busId=&stopId=`

## Next steps
- Add admin CRUD (routes/stops/buses) using Spring MVC
- Improve ETA using segment averages
- Switch to WebSocket/SSE for instant updates
- Build a small Android driver app to post GPS
