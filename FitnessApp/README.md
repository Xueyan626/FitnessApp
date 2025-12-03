## Before you start  
create a file named .env on the root directory  ( **if anything wrong with port, you may modify this .env**)   
paste:  
DATABASE_URL="postgresql://app:app123@db:5432/healthdb?schema=public"
AUTH_SECRET="1Ecpn4uKo1kXzPAdbVt2SY6BfxE1y9rC7aOULFlRxpsvZ+0FhY9Ncq4n6Tf3u8wM"

## How to start/shut down the project
Open **'docker'** desktop (you don't have to login), and run in VScode:   
docker compose down -v  
docker compose up --build  
Command+C to stop the project is fine

## Project Overview
- **Register & Login/out  & Edit Profile**  
This system supports three different kinds of users: USER, COACH, ADMIN
For the register/login function, different actors can use their name, email to register a new account and select their role. Most of the functions are performed by a USER. One user can edit their profile by modifying height, weight, birthday and so on.


- **Assessment**  
For this function, User are asked to do a questionnaire to test their consititution(10 questions). After submitting the answers, users can view their constitution type and scores from different angles. The result will be used for later plan generation & coach report.


- **Posture Analysis**  
This feature enables users to upload photos of the front, side, and back views. The system utilizes AI (Gemini API) to analyze six key body areas (including the head, shoulders, spine, pelvis, legs and feet). The system automatically verifies the image quality, performs preprocessing, and generates a personalized assessment report. The report includes specific observation results, health impact and improvement suggestions. The results will be saved for historical review and for generating subsequent plans.


- **Plan**   
This feature is based on the latest physical assessment and posture analysis results of the user, and automatically generates personalized diet and exercise plans. The system generates the plan through an AI Agent in JSON format. The system incorporates a verification and retry loop mechanism to ensure that the generated JSON plan is 100% executable and complies with specific constraints, thereby guaranteeing the reliability of the output and linking it to the user's progress tracking. The user can have conversations with the AI to modify the details of the plan at any time.


- **Todos**   
This feature generates personalized weekly health checklists based on the user’s plan. Key components include a daily checklist interface, point system (+10/-10), and progress tracking. It uses a simple ChecklistItem model with fields such as dayIndex, text, and completed. Users can create their weekly Todos, finish daily tasks, and track progress. The system also connects with the user’s plan to manage diet and exercise tasks.


- **Weekly Report**  
This feature analyzes and visualizes users’ weekly progress. It provides clear KPI cards showing total check-ins, completion rate, and streaks to help users understand their consistency. Daily progress is displayed through interactive bar and line charts, while a pie chart compares diet and exercise performance.

- **Coach version**   
This feature allows certified coaches to analyze users’ health data and provide expert feedback. Coaches can upload structured health reports (JSON) and receive AI-generated insights, including risk assessment and professional suggestions. They can also view completed analysis results and ask follow-up questions through an assistant interface, helping them support users more effectively in their wellness journey.

- **Rewards**   
The reward system motivates users to stay consistent with their health goals. Users earn points by completing assessments, daily tasks, and weekly reports. These points can be redeemed for bronze, silver, and gold badges, which represent different achievement levels. The reward dashboard clearly shows current points, earned badges, and progress toward the next level, encouraging positive behavior and long-term engagement.


## Advanced Technology
- **Front-end framework**   
Our frontend is built with React and TypeScript. We use Tailwind CSS for a simple and responsive design. The app has Server Components to load data and Client Components for interactive pages. We also use JWT tokens in cookies for login and get data from a PostgreSQL database through Prisma. The app runs fast with both server-side and client-side rendering.


- **Back-end framework**  
The backend employs Docker Compose for full environment containerization, deploying PostgreSQL with persistent volumes and Adminer for oversight. The application container features Prisma ORM integration, automatically executing Client generation and migration/seeding on startup. All Gemini AI calls and keys are securely and centrally managed on the server side. This setup, enforced with Healthchecks, guarantees the system is reproducible, highly scalable, and easily maintainable.


- **Data visualization**  
Our Weekly Report shows SVG charts based on the user’s degree of completion. The Daily Check-ins chart mixes a bar chart and a line graph to show how many tasks are done each day (Day 1–7). The Diet vs Exercise pie chart shows the balance between the two using colorful SVG circles. All charts are responsive, update interactively on the client side, and use data collected from checklist completions on the server.

- **AI tool integration**  
FitFusion's core practices, leveraging the Google Gemini API, establish robust system performance and security. Key integrations include: using Gemini's multi-modal capabilities for precise three-view posture analysis; plan generation utilizes JSON validation and auto-retry loops to ensure 100% executable plans, which users can adjust via the AI assistant and convert into a todo list. Furthermore, the AI core performs structured analysis on coaching reports to extract actionable guidance. Architecturally, the backend centralizes all AI calls as a proxy, achieving secure key injection and enhancing reliability. This is combined with Docker Compose, healthchecks, and Prisma migrations to persist all data to PostgreSQL, guaranteeing high reproducibility and observability of the running environment.


- **API Testing with Postman**  
We used Postman to test and verify our backend API endpoints during development. By sending different requests (GET, POST, PUT, DELETE) and checking the responses, we ensured that the server logic, authentication flow, and data interactions with the database were working correctly. This helped us catch errors early — such as incorrect request payloads, missing authentication tokens, or unexpected response formats — before integrating the frontend. Postman also allowed us to test edge cases quickly and repeat tests without manually triggering actions through the UI, which improved debugging efficiency and kept the API behavior consistent across the team.


- **Environment Containerization with Docker**  
We used Docker to run the application and database in isolated containers, which helped us keep everyone’s development environment consistent. Instead of manually installing dependencies on each laptop, we could start the whole system with a single command, reducing setup time and avoiding environment-related issues. Using Docker also made it easier to test updates safely, since changes inside containers do not affect the host system. Overall, Docker helped our team collaborate more smoothly and maintain a reliable development workflow.



## Configuration
### Docker Services

| Service | Container | Port | Description |
|---------|-----------|------|-------------|
| app | health_app | 3000:3000 | Next.js application |
| db | health_pg | 5433:5432 | PostgreSQL 16 database |
| adminer | health_adminer | 8080:8080 | Database UI (http://localhost:8080) |

**Database Credentials:**
- User: `app`, Password: `app123`, Database: `healthdb`
- Volume: Persistent storage at `pgdata:/var/lib/postgresql/data`

### Ports

- **3000**: Main application (http://localhost:3000)
- **5433**: PostgreSQL database
- **8080**: Adminer database admin panel

To change ports, modify the `ports` mapping in `docker-compose.yml`.

### Tech Stack

- **Framework**: Next.js 14 (React 18)
- **Database**: PostgreSQL 16 with Prisma ORM
- **Authentication**: JWT with `jose` library (7-day sessions)
- **AI**: Google Gemini API for coach analysis and plan generation
- **Styling**: Tailwind CSS 4

   
## Project Structure
<img width="629" alt="image" src="https://github.sydney.edu.au/xiyu0043/ELEC5620_Group109/assets/23853/18c86b42-d710-4209-8a71-a0d73e905d2f">
