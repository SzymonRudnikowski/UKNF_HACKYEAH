
# Instrukcja dla agentów kodu — **Platforma Komunikacyjna UKNF** (Next.js / React)

> Ten plik to **jednoznaczna specyfikacja zadań implementacyjnych** dla agentów kodu. Zawiera kompletne wytyczne „co i jak” należy zaimplementować, z podziałem na moduły, warstwy, zadania i artefakty wyjściowe. Docelowo tworzymy **demo systemu** działające w kontenerach (Docker Compose), z front‑ i backendem w **Next.js 15 (App Router)**, REST API w **Route Handlers**, bazą **MS SQL Server** (przez **Prisma**), oraz opcjonalnymi usługami pomocniczymi (MinIO, ClamAV, RabbitMQ).

**Słownik skrótów**: PN — Podmiot Nadzorowany; UKNF — urząd; UI — interfejs użytkownika.

---

## 0) Zasady ogólne wykonania

1. **Język i stack**  
   - Front i backend: **Next.js 15 (App Router, TypeScript)**.  
   - Stylowanie: **Tailwind CSS** + **shadcn/ui** (komponenty Radix), **lucide-react** (ikony).  
   - Tabele: **TanStack Table**. Formularze: **React Hook Form** + **Zod**.  
   - Dane: **Prisma** (`provider = "sqlserver"`) + **MS SQL Server**.  
   - Autoryzacja: **NextAuth** (Credentials Provider dla demo) + **RBAC** (role/permissions w DB), **JWT**.  
   - Upload plików: bezpośrednio do **MinIO (S3 compatible)** z podpisanymi URL‑ami; w tle **ClamAV** (skan AV).  
   - Kolejki/zdarzenia (opcjonalnie): **RabbitMQ** (walidacja sprawozdań asynchronicznie).  
   - Testy: **Vitest** (unit), **Playwright** (e2e), **Supertest** (API).  
   - Dokumentacja API: **OpenAPI 3.1** wygenerowany statycznie z definicji Zod + transformer (np. `zod-to-openapi`).

2. **Wymogi niefunkcjonalne — must have w demie**  
   - HTTPS gotowe do terminacji na reverse proxy (poza zakresem Compose).  
   - Walidacja wszystkich wejść (Zod), zabezpieczenia: CSRF (NextAuth), XSS, SSRF, rate limiting (prosty limiter IP + token bucket w Redisie lub w pamięci na demo).  
   - Audyt: zapisy zdarzeń istotnych (logowanie, modyfikacje, odczyty krytyczne).  
   - WCAG 2.2 AA: focus ring, kontrast, klawiatura, aria‑*.

3. **Gotowe do uruchomienia**  
   - `docker-compose.yml` uruchamia: `web` (Next.js), `mssql`, `minio`, `clamav`, **opcjonalnie** `rabbitmq`, `redis`.  
   - Polecenie: `docker compose up -d` → po init skryptach aplikacja dostępna na `http://localhost:3000`.

---

## 1) Architektura i struktura katalogów

```
apps/
  web/                       # Next.js (frontend + REST API w route handlers)
    app/
      (auth)/                # segment autoryzacji
        sign-in/             # logowanie
        sign-up/             # rejestracja zewnętrzna (demo)
      (dashboard)/
        layout.tsx
        page.tsx
      admin/                 # moduł administracyjny
      communication/         # moduł komunikacyjny
        messages/            # wiadomości (wątki)
        reports/             # sprawozdania + walidacja
        cases/               # sprawy
        announcements/       # tablica ogłoszeń
        library/             # repozytorium plików
        subjects/            # kartoteka podmiotów (PN)
        faq/                 # baza Q&A
        contacts/            # adresaci, grupy, kontakty
      api/
        auth/[...nextauth]/route.ts
        files/
          presign/route.ts   # podpisywane URL-e do uploadu
          callback/route.ts  # webhook po skanie AV/po walidacji
        messages/route.ts
        messages/[id]/route.ts
        reports/route.ts
        reports/[id]/route.ts
        cases/route.ts
        cases/[id]/route.ts
        announcements/route.ts
        faq/route.ts
        subjects/route.ts
        contacts/route.ts
        access-requests/route.ts
        admin/
          users/route.ts
          roles/route.ts
          policies/route.ts
      (public)/api-docs/     # statyczny swagger-ui + openapi.json
    components/              # wspólne komponenty UI
    features/                # logika przypadków użycia (hooks, serwisy)
    lib/                     # utilsy: auth, rbac, db, mail, storage, audit, rate-limit
    prisma/
      schema.prisma
      seed.ts
    styles/
    middleware.ts
    next.config.mjs
    package.json
docker/
  mssql/
  minio/
  clamav/
  rabbitmq/                  # opcjonalnie
  redis/
docker-compose.yml
openapi/
  openapi.yaml
README.md
prompts.md
```

**Zadanie dla agenta:** utworzyć powyższy szkielet (pliki puste, gdzie wskazano).

---

## 2) Model danych (Prisma, MS SQL)

> Poniżej kluczowe tabele. Uzupełniamy indeksy, klucze obce, wartości enum, daty audytowe (`createdAt`, `updatedAt`, `createdById`, `updatedById`).

**Wymagane encje (skrótowo):**
- `User` (wewnętrzny/zewnętrzny), `Role`, `Permission`, `UserRole`, `RolePermission`
- `Subject` (Kartoteka Podmiotów — pełny zestaw pól: typ, LEI, NIP, KRS, adres itd.)
- `AccessRequest` (wnioski o dostęp) + linie uprawnień `AccessRequestLine`
- `MessageThread`, `Message`, `MessageAttachment`
- `Report`, `ReportValidation` (statusy walidacji, wynik, raport), `ReportRegister` (kategoryzacja)
- `Case` (sprawy) + `CaseAttachment`
- `Announcement` (ogłoszenia) + `AnnouncementReadReceipt`
- `LibraryFile` (repozytorium) + wersjonowanie `LibraryFileVersion`, uprawnienia dostępu
- `FaqQuestion`, `FaqAnswer`
- `Contact`, `ContactGroup`, `ContactGroupMember`
- `RecipientRule` (adresaci: wg typu podmiotu, podmioty, użytkownicy, grupy kontaktów)
- `Notification` (powiadomienia UI/e-mail), `AuditLog`

**Statusy (enumy):** zdefiniować wg dokumentu:  
- Raport (`ReportStatus`): `DRAFT`, `SUBMITTED`, `PROCESSING`, `SUCCESS`, `VALIDATION_ERRORS`, `TECH_ERROR`, `TIMEOUT`, `DISPUTED_BY_UKNF`.  
- Wiadomość (`MessageStatus`): `WAITING_FOR_UKNF`, `WAITING_FOR_USER`, `CLOSED`.  
- Sprawa (`CaseStatus`): `DRAFT`, `NEW`, `IN_PROGRESS`, `NEED_INFO`, `DONE`, `CANCELLED`.  
- Wniosek o dostęp (`AccessRequestStatus`): `DRAFT`, `NEW`, `APPROVED`, `BLOCKED`, `UPDATED`.
- Ogłoszenie – priorytet: `LOW`, `MEDIUM`, `HIGH` (w `Announcement.priority`).

**Przykładowy fragment `schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  hashedPassword String?
  firstName     String
  lastName      String
  peselMasked   String?  // tylko 4 ostatnie cyfry widoczne
  phone         String?
  isInternal    Boolean  // pracownik UKNF?
  isActive      Boolean  @default(true)
  roles         UserRole[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Role {
  id          String @id @default(cuid())
  name        String @unique
  description String?
  permissions RolePermission[]
  users       UserRole[]
}

model Permission {
  id   String @id @default(cuid())
  code String @unique // Np. COMMUNICATION_VIEW, REPORTS_EDIT itp.
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id])
  role   Role @relation(fields: [roleId], references: [id])
  @@id([userId, roleId])
}

model Subject {
  id                 Int     @id @default(autoincrement())
  type               String? // "Instytucja Pożyczkowa" itp.
  uknfCode           String?
  name               String
  lei                String?
  nip                String?
  krs                String?
  street             String?
  buildingNo         String?
  unitNo             String?
  postalCode         String?
  city               String?
  phone              String?
  email              String?
  registryEntryNo    String?
  status             String? // Wpisany, Wykreślony
  category           String?
  sector             String?
  subsector          String?
  isCrossBorder      Boolean @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

**Zadanie dla agenta:** dopisać wszystkie encje i relacje, z indeksami i ograniczeniami unikalności, zgodnie z wymaganiami.

---

## 3) Autentykacja i autoryzacja (NextAuth + RBAC)

1. **NextAuth**  
   - Provider: **Credentials** (demo: e‑mail + hasło, hasła w `bcrypt`), przygotować **hook pod OIDC** (np. Azure AD) — funkcja/adapter w `lib/auth/oidc.ts` (na później).  
   - Sesje JWT (`strategy: "jwt"`), w tokenie `sub`, `roles`, `isInternal`, `subjectIds[]`.  
   - Middleware `middleware.ts` — ochrona segmentów `/(dashboard|communication|admin)`.

2. **RBAC**  
   - Implementacja w `lib/rbac.ts`: `hasPermission(user, "PERM_CODE")`.  
   - Mapowanie ról na uprawnienia (seed). Role przykładowe: `UKNF_ADMIN`, `UKNF_WORKER`, `SUBJECT_ADMIN`, `SUBJECT_EMPLOYEE`.

3. **Polityka haseł**  
   - Walidacja: min. długość, złożoność; endpoint admin do konfiguracji polityki (demo: stałe).

**Zadania:** skonfigurować NextAuth, napisać middleware, zasiać role/uprawnienia i użytkowników demo (wew./zew.).

---

## 4) Moduł **Komunikacyjny** — wymagania i implementacja

### 4.1. Sprawozdania (upload, walidacja, rejestry, korekty)
- UI: lista sprawozdań z filtrami (status, okres, podmiot), widok szczegółów, upload nowego pliku (XLSX), powiązanie z PN, obsługa **korekty** (link do sprawozdania korygowanego).  
- Upload: presign URL do MinIO, metadane do DB → po zakończeniu uploadu **zadanie walidacji**:  
  - W demie: fikcyjny worker (cron lub API) „przetwarza” i zapisuje wynik (`SUCCESS` / `VALIDATION_ERRORS` / `TECH_ERROR`).  
  - Obsłużyć **timeout 24h** → automatycznie ustawić `TIMEOUT`.  
- Rejestry sprawozdań: `ReportRegister` (np. „Kwartalne”, „Roczne”, „Archiwalne”), możliwość przenoszenia.  
- Generowanie raportu walidacji (plik + JSON z błędami) i dołączanie do sprawozdania.  
- Widok UKNF: „Podmioty bez sprawozdania w okresie X” + możliwość wysłania komunikatu do tych PN.

**API (przykład):**
- `POST /api/reports` – utworzenie rekordu + presign dla uploadu.  
- `POST /api/reports/{id}/submit` – zainicjowanie walidacji.  
- `GET /api/reports?status=&period=&subjectId=` …  
- `POST /api/reports/{id}/dispute` – „Zakwestionuj” (UKNF) z opisem.  
- `POST /api/reports/{id}/archive` – archiwizacja.

### 4.2. Wiadomości (z załącznikami, statusy, wątki)
- UI „jak poczta”: lista wątków + filtr po PN/komponencie, panel rozmowy, upload załączników (PDF/DOC/XLS/CSV/TXT/MP3/ZIP do łącznych 100 MB, odrzucenie formatu/rozmiaru).  
- Statusy: `WAITING_FOR_UKNF` / `WAITING_FOR_USER` / `CLOSED`.  
- Masowa komunikacja: wybór odbiorców wg reguł (PN typy/podmioty/użytkownicy/grupy).

**API (przykład):**
- `POST /api/messages` (tworzy wątek), `POST /api/messages/{id}` (odpowiedź), `GET /api/messages?...`  
- `POST /api/messages/bulk` z `RecipientRule`.

### 4.3. Sprawy (teczki spraw)
- Kategorie: „Zmiana danych rejestrowych”, „Zmiana składu osobowego”, „Wezwanie…”, „Uprawnienia…”, „Sprawozdawczość”, „Inne”. Priorytety: `LOW|MEDIUM|HIGH`.  
- Statusy wg wymagań. Anulowanie sprawy jeśli „Nowa” i nikt nie odczytał. Historia zmian.

**API:** `POST /api/cases`, `GET /api/cases`, `PATCH /api/cases/{id}`, `POST /api/cases/{id}/cancel`, …

### 4.4. Tablica ogłoszeń
- Tworzenie/edycja/publikacja, **wymagalność potwierdzenia** dla `HIGH`. Widok statystyk odczytu (np. 71/100).  
- `AnnouncementReadReceipt` (użytkownik, PN, data).

**API:** `POST /api/announcements`, `GET /api/announcements?audience=…`, `POST /api/announcements/{id}/ack`.

### 4.5. Repozytorium plików (Biblioteka)
- Kategorie, wyszukiwanie, filtrowanie, **wersjonowanie**; metadane: „Nazwa pliku”, „Okres sprawozdawczy”, „Data aktualizacji wzoru”.  
- Udostępnienie: wszystkim / wybranym PN / grupom użytkowników / pojedynczym.  
- Historia wersji i zmian.

**API:** `POST /api/library`, `GET /api/library?...`, `POST /api/library/{id}/version`.

### 4.6. Kartoteka Podmiotów
- CRUD, historia zmian, widok listy użytkowników PN, zgłaszanie zmian rejestrowych (tworzy sprawę).

**API:** `GET/POST/PATCH /api/subjects`.

### 4.7. FAQ (Baza wiedzy)
- Pytania (także anonimowe): tytuł, treść, kategoria, tagi, data, status; odpowiedzi dodaje UKNF; oceny 1‑5.  
- Filtrowanie/sortowanie/wyszukiwanie.

**API:** `GET/POST /api/faq`, `POST /api/faq/{id}/answer`, `POST /api/faq/{id}/vote`.

### 4.8. Adresaci, grupy kontaktów, kontakty
- 4 tryby adresatów (wg specyfikacji): typy PN, konkretne PN, wybrani użytkownicy, grupy kontaktów.  
- `Contact` może nie być użytkownikiem systemu.

**API:** `GET/POST /api/contacts`, `GET/POST /api/contact-groups`, `POST /api/recipient-rules`.

---

## 5) Moduł **Uwierzytelnienia i Autoryzacji**

### 5.1. Rejestracja użytkowników zewnętrznych
- Formularz: Imię, Nazwisko, PESEL (maskowany, widoczne 4 cyfry), telefon, e‑mail.  
- Flow: rejestracja → e‑mail aktywacyjny → ustawienie hasła zgodnie z polityką.

### 5.2. Wnioski o dostęp
- Automatyczne utworzenie wniosku `DRAFT` po aktywacji konta.  
- Edycja przez przedstawiciela podmiotu; przypisanie PN i uprawnień (Sprawozdawczość, Sprawy, Admin podmiotu).  
- Statusy: `DRAFT` → `NEW` → `APPROVED|BLOCKED|UPDATED`.  
- Komunikacja w ramach wniosku przez wiadomości (wątki).  
- Widoki zestawień: UKNF (szybkie filtry „Moje podmioty”, „Wymaga działania UKNF”, „Obsługiwany przez UKNF”), PN (swoje wnioski).

### 5.3. Wybór podmiotu w sesji
- Przełącznik PN w headerze po zalogowaniu (context switch bannerek, breadcrumbs).

---

## 6) Moduł **Administracyjny**

- Zarządzanie kontami (wew./zew.): tworzenie/edycja/dezaktywacja, reset haseł.  
- Polityka haseł: długość, złożoność, historia; wymuszenie zmiany.  
- Role i uprawnienia: CRUD ról, przypisywanie użytkowników, przegląd mapy uprawnień.

**API:** `GET/POST/PATCH /api/admin/users|roles|policies`.

---

## 7) UI — nawigacja, dashboardy, listy

1. **Nawigacja**: główne menu z podziałem na moduły + breadcrumbs; personalizacja widoków (rola).  
2. **Dashboard komunikacyjny**: skróty do Sprawozdań/Wiadomości/Spraw/Ogłoszeń/FAQ; „do zrobienia”; timeline zdarzeń; wskaźniki bezpieczeństwa (ostatnie logowanie/zmiana hasła).  
3. **Listy i tabele**: wyszukiwanie nad tabelą, sortowanie każdej kolumny, filtry kontekstowe (select, zakres dat), **paginacja** i wybór page size, **eksport** (XLSX/CSV/JSON) z zachowaniem filtrów i sortowania, sticky header, akcje w wierszu.

**Zadania UI (per ekran)**: przygotować layout, formularze z RHF + Zod, obsługę błędów i stanów ładowania, testy e2e najważniejszych ścieżek.

---

## 8) Bezpieczeństwo, pliki, AV, limity

- **Upload w chunkach** (demo: prosty chunk API `/api/files/chunk` + scalanie; alternatywnie TUS poza zakresem).  
- **Skany AV**: po uploadzie zadanie do ClamAV; wynik zapisany przy pliku; pliki zarażone → blokada pobrania + komunikat.  
- **Odrzucenie** nieobsługiwanych rozszerzeń i zbyt dużych plików.  
- **Szyfrowanie at‑rest**: na demo trzymamy w MinIO (SSE na poziomie MinIO włączone przez zmienne środowiskowe).  
- **Rate limit**: 60 req/min na IP na wrażliwych endpointach.  
- **Audyt**: tabela `AuditLog` + helper `audit(actor, action, entity, before, after)`.

---

## 9) API — kontrakty i przykłady

> Wszystkie route handlers zwracają `application/json`, schematy request/response walidowane Zod. Błędy: RFC7807 (`type`, `title`, `status`, `detail`).

**Przykład: utworzenie sprawozdania**
```http
POST /api/reports
Content-Type: application/json
Authorization: Bearer <JWT>

{
  "subjectId": 123,
  "period": "2025-Q1",
  "register": "Kwartalne",
  "filename": "G.RIP100000_Q1_2025.xlsx",
  "size": 1048576,
  "mime": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
}
---
201 Created
{
  "id": "rep_abc123",
  "upload": {
    "url": "https://minio.local/....",
    "fields": { "...": "..." }
  }
}
```

**Przykład: lista wiadomości**
```http
GET /api/messages?status=WAITING_FOR_UKNF&subjectId=123&page=1&pageSize=20
```

**OpenAPI**: zbudować `openapi/openapi.yaml` + hostować pod `/api-docs` (swagger-ui statyczny).

---

## 10) Docker Compose i konfiguracja

**`.env` (przykład):**
```
DATABASE_URL="sqlserver://sa:Your_Strong!Passw0rd@localhost:1433;database=uknf_app;encrypt=true;trustServerCertificate=true"
NEXTAUTH_SECRET="dev_secret_change_me"
NEXTAUTH_URL="http://localhost:3000"
S3_ENDPOINT="http://minio:9000"
S3_ACCESS_KEY=minio
S3_SECRET_KEY=miniosecret
S3_BUCKET=uknf-files
CLAMAV_HOST=clamav
CLAMAV_PORT=3310
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/
REDIS_URL=redis://redis:6379
```

**`docker-compose.yml` (skrót):**
```yaml
services:
  web:
    build: ./apps/web
    ports: [ "3000:3000" ]
    env_file: .env
    depends_on: [ mssql, minio, clamav ]
  mssql:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=Your_Strong!Passw0rd
    ports: [ "1433:1433" ]
    volumes: [ "mssql_data:/var/opt/mssql" ]
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=minio
      - MINIO_ROOT_PASSWORD=miniosecret
    ports: [ "9000:9000", "9001:9001" ]
    volumes: [ "minio_data:/data" ]
  clamav:
    image: clamav/clamav:stable
    ports: [ "3310:3310" ]
  rabbitmq:
    image: rabbitmq:3-management
    ports: [ "5672:5672", "15672:15672" ]
  redis:
    image: redis:7-alpine
    ports: [ "6379:6379" ]
volumes:
  mssql_data: {}
  minio_data: {}
```

**Zadania automatyczne (init):**
- Po starcie: migracje `prisma migrate deploy`, `prisma db seed`, utworzenie bucketu MinIO i polityk, wgranie **plików testowych** (szablony sprawozdań) do Biblioteki.

---

## 11) Szkielety kodu — kluczowe pliki

**`app/api/auth/[...nextauth]/route.ts` (zarys)**
```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
export const { GET, POST } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const user = await prisma.user.findUnique({ where: { email: creds!.email } });
        if (!user || !user.hashedPassword) return null;
        const ok = await compare(creds!.password, user.hashedPassword);
        return ok ? { id: user.id, email: user.email } : null;
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id as string }, include: { roles: { include: { role: { include: { permissions: true } } } } } });
        token.roles = dbUser?.roles.map(r => r.role.name) ?? [];
        token.perms = dbUser?.roles.flatMap(r => r.role.permissions.map(p => p.code)) ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      session.user.roles = (token as any).roles ?? [];
      session.user.perms = (token as any).perms ?? [];
      return session;
    }
  }
});
```

**`middleware.ts` (zarys)**
```ts
import { withAuth } from "next-auth/middleware";
export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/admin")) return token?.roles?.includes("UKNF_ADMIN");
      if (path.startsWith("/communication") || path.startsWith("/dashboard")) return !!token;
      return true;
    }
  }
});
export const config = { matcher: ["/dashboard/:path*", "/communication/:path*", "/admin/:path*"] };
```

**Komponent tabeli (skrót, TanStack Table)** — przygotować plik `components/DataTable.tsx` z sortowaniem, filtrowaniem, paginacją, eksportem.

---

## 12) Import danych testowych i plików

- **Podmioty**: zaimportować testowy zestaw (CSV/JSON) do `Subject`.  
- **Sprawozdania**: wgrać przykładowe XLSX (poprawny i błędny) — oznaczyć wynik walidacji w demie.  
- **Użytkownicy**: stworzyć 1× `UKNF_ADMIN`, 2× `UKNF_WORKER`, 1× `SUBJECT_ADMIN`, 2× `SUBJECT_EMPLOYEE`.

---

## 13) Powiadomienia i „realtime”

- Dla demo: **polling** (SWR/React Query `refetchInterval`) albo **SSE** endpoint `/api/notifications/stream`.  
- Wysyłać zdarzenia: nowa wiadomość, wynik walidacji, nowe ogłoszenie, zmiana statusu sprawy.

---

## 14) Testy i jakość

- **Unit** (Vitest): walidacje Zod, serwisy domenowe (RBAC, audit, recipient rules).  
- **API** (Supertest): ścieżki krytyczne (raporty, wiadomości, sprawy, ogłoszenia).  
- **E2E** (Playwright): logowanie, wysyłka sprawozdania, odpowiedź na wiadomość, potwierdzenie ogłoszenia `HIGH`.  
- **CI zadania** (skrypty npm): `lint`, `typecheck`, `test`, `build`, `prisma:generate`, `prisma:migrate`.

---

## 15) UX i dostępność (WCAG 2.2)

- Kontrast, focus, etykiety `aria-*`, role landmark.  
- Tryb wysokiego kontrastu (toggle w headerze).  
- Klawiatura: obsługa wszystkich akcji bez myszy.  
- Teksty błędów zrozumiałe, podpięte do pól formularzy.

---

## 16) Artefakty do dostarczenia

1. Repo z kodem: cała struktura `apps/web`, `docker-compose.yml`, `openapi.yaml`.  
2. **`prompts.md`** – chronologiczna lista promptów użytych podczas tworzenia (z komentarzem: które były najefektywniejsze i dlaczego).  
3. **README**: instalacja, konfiguracja, uruchomienie.  
4. Zrzuty ekranu/gif z działania krytycznych ścieżek (opcjonalnie).

---

## 17) Kryteria „gotowości” (DoD) per moduł

- **Komunikacyjny**: upload XLSX → walidacja → status + raport; wątki wiadomości z załącznikami i statusami; sprawy z pełnym workflow; ogłoszenia z potwierdzeniami; biblioteka z wersjonowaniem; PN (CRUD + historia).  
- **Uwierzytelnienie/Autoryzacja**: rejestracja zewn., aktywacja, logowanie, wybór PN, wnioski o dostęp; RBAC działa.  
- **Administracyjny**: konta (CRUD), role (CRUD), polityka haseł (edytowalna lub stała dla demo).  
- **Niefunkcjonalne**: audyt, ograniczenia uploadu, skan AV, rate‑limit, WCAG, testy przechodzą.

---

## 18) Roadmapa rozszerzeń (po demie)

- Integracja OIDC (Azure AD), powiadomienia e‑mail, podpisywanie dokumentów, TUS dla uploadu, WebSocket (Socket.IO) dla pełnego realtime, cache Redis per‑query, eksport PDF/Docx.

---

### Koniec specyfikacji
