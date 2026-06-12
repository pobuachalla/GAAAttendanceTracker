-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'COACH',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "ageCategory" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "SessionType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AttendanceCode" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "colour" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "protected" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT,
    "dob" DATETIME,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" DATETIME,
    "codePreference" TEXT NOT NULL DEFAULT 'dual',
    "positions" TEXT NOT NULL DEFAULT '[]',
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "photoUrl" TEXT
);

-- CreateTable
CREATE TABLE "PlayerStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sessionId" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerStatus_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonId" TEXT NOT NULL,
    "typeId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "venueId" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "cancelReason" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "opposition" TEXT,
    "homeAway" TEXT,
    "competition" TEXT,
    "ourScore" TEXT,
    "theirScore" TEXT,
    "notes" TEXT,
    CONSTRAINT "Session_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "SessionType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "note" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attendance_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attendance_code_fkey" FOREIGN KEY ("code") REFERENCES "AttendanceCode" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attendance_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "position" TEXT,
    "note" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MatchSelection_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamLayoutVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positionsJson" TEXT NOT NULL,
    CONSTRAINT "TeamLayoutVariant_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlayerMatchScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "freesWon" INTEGER NOT NULL DEFAULT 0,
    "freesConverted" INTEGER NOT NULL DEFAULT 0,
    "yellows" INTEGER NOT NULL DEFAULT 0,
    "blacks" INTEGER NOT NULL DEFAULT 0,
    "reds" INTEGER NOT NULL DEFAULT 0,
    "minutesPlayed" INTEGER,
    "position" TEXT,
    "motm" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PlayerMatchScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PlayerMatchScore_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RunRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "testType" TEXT NOT NULL,
    "conditions" TEXT
);

-- CreateTable
CREATE TABLE "RunResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runRecordId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "result" REAL NOT NULL,
    "personalBest" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RunResult_runRecordId_fkey" FOREIGN KEY ("runRecordId") REFERENCES "RunRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RunResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BroncoSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "conditions" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BroncoResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "timeSeconds" REAL NOT NULL,
    "mas" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BroncoResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BroncoSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BroncoResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SessionType_name_key" ON "SessionType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_playerId_key" ON "Attendance"("sessionId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchSelection_sessionId_playerId_key" ON "MatchSelection"("sessionId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMatchScore_sessionId_playerId_key" ON "PlayerMatchScore"("sessionId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "BroncoResult_sessionId_playerId_key" ON "BroncoResult"("sessionId", "playerId");
