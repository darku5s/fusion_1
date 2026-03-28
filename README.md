# FusionIIIT - Campus Management System

FusionIIIT is a comprehensive campus management system designed for IIITs. It provides a modular approach to various campus activities, starting with a robust **Visitor Management System (VMS)**.

## 🚀 Tech Stack

### Backend
- **Framework**: [Django](https://www.djangoproject.com/)
- **API**: [Django REST Framework](https://www.django-rest-framework.org/)
- **Database**: SQLite (Development)
- **Authentication**: Token-based authentication

### Frontend
- **Framework**: [React](https://react.dev/) (Vite)
- **UI Library**: [Mantine UI](https://mantine.dev/)
- **Icons**: [Tabler Icons](https://tabler.io/icons)
- **HTTP Client**: Axios

---

## 🛠️ Features

### Visitor Management System (VMS)
The VMS module allows for seamless tracking and management of visitors within the campus.

- **Dashboard**: Real-time overview of active visitors, pending approvals, and today's schedule.
- **Visitor Registration**: Easy form for registering new visitors with host information.
- **Host Approval**: Automated notification and approval workflow for hosts.
- **Blacklist Management**: Maintain a security list of restricted individuals.
- **Incident Reporting**: Log and track security incidents related to visitors.
- **Reports & Analytics**: Export visitor data and view trends.

---

## ⚙️ Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup
1. Navigate to the root directory:
   ```bash
   cd FusionIIIT
   ```
2. Install Python dependencies:
   ```bash
   pip install django djangorestframework django-cors-headers
   ```
3. Run migrations:
   ```bash
   python manage.py migrate
   ```
4. Start the server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd FUSIONCLIENT
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

- `applications/vms/`: Backend logic for the Visitor Management System.
- `FUSIONCLIENT/src/Modules/VMS/`: Frontend components and pages for VMS.
- `Fusion/settings/`: Project configuration and settings.

## 📄 License
This project is licensed under the MIT License.
