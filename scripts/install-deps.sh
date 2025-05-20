#!/bin/bash

# Install production dependencies
yarn add \
  inversify \
  reflect-metadata \
  express \
  @types/express \
  bcrypt \
  @types/bcrypt \
  jsonwebtoken \
  @types/jsonwebtoken \
  uuid \
  @types/uuid \
  winston \
  winston-daily-rotate-file \
  @types/winston \
  typeorm \
  pg \
  @types/pg \
  redis \
  @types/redis \
  zod \
  class-validator \
  class-transformer

# Install development dependencies
yarn add -D \
  typescript \
  @types/node \
  ts-node \
  nodemon \
  jest \
  @types/jest \
  ts-jest \
  supertest \
  @types/supertest
