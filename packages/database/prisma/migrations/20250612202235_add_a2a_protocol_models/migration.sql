/*
  Warnings:

  - The `type` column on the `agents` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('GENERIC', 'CODER', 'ANALYZER', 'COORDINATOR', 'COMMUNICATOR');

-- CreateEnum
CREATE TYPE "EntityStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "A2AAgentStatus" AS ENUM ('ONLINE', 'OFFLINE', 'BUSY', 'IDLE', 'ERROR');

-- CreateEnum
CREATE TYPE "A2AMessageType" AS ENUM ('HANDSHAKE', 'REQUEST', 'RESPONSE', 'NOTIFICATION', 'HEARTBEAT', 'ERROR', 'BROADCAST');

-- CreateEnum
CREATE TYPE "A2AMessagePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "A2AConversationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "userId" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "AgentType" NOT NULL DEFAULT 'GENERIC';

-- CreateTable
CREATE TABLE "registered_entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registered_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a2a_agents" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "endpoints" JSONB,
    "authentication" JSONB,
    "status" "A2AAgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastHeartbeat" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "a2a_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a2a_agent_capabilities" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "parameters" JSONB,
    "metadata" JSONB,

    CONSTRAINT "a2a_agent_capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a2a_messages" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "protocolVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromAgentId" TEXT NOT NULL,
    "toAgentId" TEXT,
    "type" "A2AMessageType" NOT NULL,
    "priority" "A2AMessagePriority" NOT NULL DEFAULT 'MEDIUM',
    "conversationId" TEXT,
    "requestId" TEXT,
    "ttl" INTEGER,
    "payload" JSONB NOT NULL,
    "routing" JSONB,
    "signature" TEXT,
    "checksum" TEXT,
    "metadata" JSONB,
    "deliveredAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "a2a_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a2a_conversations" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "topic" TEXT,
    "status" "A2AConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "a2a_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a2a_conversation_participants" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "role" TEXT,

    CONSTRAINT "a2a_conversation_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "a2a_heartbeats" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "status" "A2AAgentStatus" NOT NULL,
    "load" DOUBLE PRECISION,
    "activeConnections" INTEGER,
    "lastActivity" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "a2a_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "a2a_agents_agentId_key" ON "a2a_agents"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "a2a_agent_capabilities_agentId_name_key" ON "a2a_agent_capabilities"("agentId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "a2a_messages_messageId_key" ON "a2a_messages"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "a2a_conversations_conversationId_key" ON "a2a_conversations"("conversationId");

-- CreateIndex
CREATE UNIQUE INDEX "a2a_conversation_participants_conversationId_agentId_key" ON "a2a_conversation_participants"("conversationId", "agentId");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "a2a_agent_capabilities" ADD CONSTRAINT "a2a_agent_capabilities_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "a2a_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "a2a_messages" ADD CONSTRAINT "a2a_messages_fromAgentId_fkey" FOREIGN KEY ("fromAgentId") REFERENCES "a2a_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "a2a_messages" ADD CONSTRAINT "a2a_messages_toAgentId_fkey" FOREIGN KEY ("toAgentId") REFERENCES "a2a_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "a2a_messages" ADD CONSTRAINT "a2a_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "a2a_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "a2a_conversation_participants" ADD CONSTRAINT "a2a_conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "a2a_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "a2a_conversation_participants" ADD CONSTRAINT "a2a_conversation_participants_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "a2a_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "a2a_heartbeats" ADD CONSTRAINT "a2a_heartbeats_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "a2a_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
