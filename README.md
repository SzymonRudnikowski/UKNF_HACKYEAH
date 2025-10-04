# Platforma Komunikacyjna UKNF

System komunikacyjny Urzędu Komisji Nadzoru Finansowego (UKNF) umożliwiający bezpieczną komunikację między UKNF a podmiotami nadzorowanymi.

## 🚀 Funkcjonalności

### Moduł Komunikacyjny
- **Sprawozdania** - składanie sprawozdań elektronicznych z automatyczną walidacją
- **Wiadomości** - bezpieczna komunikacja między UKNF a podmiotami
- **Sprawy** - zarządzanie sprawami i dokumentami
- **Ogłoszenia** - publikowanie i potwierdzanie ogłoszeń
- **Biblioteka** - repozytorium dokumentów i szablonów
- **Podmioty** - kartoteka podmiotów nadzorowanych
- **FAQ** - baza wiedzy i odpowiedzi na pytania

### System Uwierzytelniania i Autoryzacji
- **NextAuth.js** z providerem credentials
- **RBAC** (Role-Based Access Control)
- **Rejestracja** użytkowników zewnętrznych
- **Wnioski o dostęp** do podmiotów nadzorowanych

### Moduł Administracyjny
- Zarządzanie użytkownikami i rolami
- Polityka haseł
- Logi audytowe
- Konfiguracja systemu

## 🛠️ Technologie

- **Frontend/Backend**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Baza danych**: MS SQL Server + Prisma ORM
- **Autoryzacja**: NextAuth.js
- **Storage**: MinIO (S3 compatible)
- **Antivirus**: ClamAV
- **Cache**: Redis
- **Kolejki**: RabbitMQ (opcjonalnie)
- **Testy**: Vitest + Playwright
- **Konteneryzacja**: Docker Compose

## 📋 Wymagania

- Node.js 18+
- Docker & Docker Compose
- Git

## 🚀 Szybki start

### 1. Klonowanie repozytorium

```bash
git clone <repository-url>
cd uknfhackyeah
```

### 2. Konfiguracja środowiska

```bash
cp env.example .env.local
```

Edytuj plik `.env.local` i ustaw odpowiednie wartości:

```env
DATABASE_URL="sqlserver://sa:Your_Strong!Passw0rd@localhost:1433;database=uknf_app;encrypt=true;trustServerCertificate=true"
NEXTAUTH_SECRET="dev_secret_change_me"
NEXTAUTH_URL="http://localhost:3000"
S3_ENDPOINT="http://minio:9000"
S3_ACCESS_KEY="minio"
S3_SECRET_KEY="miniosecret"
S3_BUCKET="uknf-files"
CLAMAV_HOST="clamav"
CLAMAV_PORT="3310"
RABBITMQ_URL="amqp://guest:guest@rabbitmq:5672/"
REDIS_URL="redis://redis:6379"
```

### 3. Uruchomienie z Docker Compose

```bash
docker compose up -d
```

To polecenie uruchomi:
- Aplikację Next.js na porcie 3000
- MS SQL Server na porcie 1433
- MinIO na portach 9000 (API) i 9001 (Console)
- ClamAV na porcie 3310
- Redis na porcie 6379
- RabbitMQ na portach 5672 i 15672

### 4. Dostęp do aplikacji

- **Aplikacja**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (minio/miniosecret)
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## 👥 Konta demo

Po uruchomieniu aplikacji dostępne są następujące konta:

### UKNF (pracownicy)
- **Admin**: admin@uknf.gov.pl / password123
- **Worker**: worker@uknf.gov.pl / password123

### Podmioty nadzorowane
- **Admin**: admin@bank.pl / password123
- **Employee**: employee@bank.pl / password123

## 📁 Struktura projektu

```
uknfhackyeah/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Strony uwierzytelniania
│   │   ├── (dashboard)/       # Dashboard i główne strony
│   │   ├── api/               # API routes
│   │   └── communication/     # Moduł komunikacyjny
│   ├── components/            # Komponenty React
│   └── lib/                   # Utilities i konfiguracja
├── prisma/                    # Schema bazy danych i migracje
├── docker-compose.yml         # Konfiguracja Docker
├── Dockerfile                 # Obraz aplikacji
└── README.md
```

## 🔧 Rozwój

### Instalacja zależności

```bash
npm install
```

### Uruchomienie w trybie deweloperskim

```bash
npm run dev
```

### Generowanie klienta Prisma

```bash
npm run prisma:generate
```

### Uruchomienie migracji

```bash
npm run prisma:migrate
```

### Seed bazy danych

```bash
npm run prisma:seed
```

### Testy

```bash
# Testy jednostkowe
npm run test

# Testy e2e
npm run test:e2e
```

## 🗄️ Baza danych

### Migracje

```bash
# Tworzenie nowej migracji
npx prisma migrate dev --name migration_name

# Aplikowanie migracji
npx prisma migrate deploy

# Reset bazy danych
npx prisma migrate reset
```

### Prisma Studio

```bash
npx prisma studio
```

## 🔒 Bezpieczeństwo

- **CSRF Protection** - NextAuth.js
- **Rate Limiting** - 60 req/min na IP
- **Antivirus Scanning** - ClamAV dla uploadowanych plików
- **Audit Logging** - pełne logowanie działań użytkowników
- **RBAC** - kontrola dostępu oparta na rolach
- **Input Validation** - Zod schemas
- **File Upload Security** - walidacja typów i rozmiarów plików

## 📊 Monitoring i logi

### Logi aplikacji

```bash
docker compose logs -f web
```

### Logi bazy danych

```bash
docker compose logs -f mssql
```

### Health checks

Wszystkie serwisy mają skonfigurowane health checks dostępne w Docker Compose.

## 🚀 Deployment

### Produkcja

1. Ustaw zmienne środowiskowe produkcyjne
2. Zbuduj obraz: `docker build -t uknf-platform .`
3. Uruchom: `docker compose -f docker-compose.prod.yml up -d`

### HTTPS

Aplikacja jest gotowa do terminacji HTTPS na reverse proxy (nginx, traefik).

## 🤝 Wkład w rozwój

1. Fork repozytorium
2. Utwórz branch dla funkcjonalności (`git checkout -b feature/amazing-feature`)
3. Commit zmian (`git commit -m 'Add amazing feature'`)
4. Push do brancha (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📝 Licencja

Ten projekt jest własnością Urzędu Komisji Nadzoru Finansowego.

## 📞 Wsparcie

W przypadku problemów lub pytań, skontaktuj się z zespołem deweloperskim UKNF.

---

**Uwaga**: To jest demo systemu. W środowisku produkcyjnym należy zastosować odpowiednie zabezpieczenia i konfigurację.