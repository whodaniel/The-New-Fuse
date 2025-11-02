import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { CascadeController, CascadeMode, CascadeState, CascadeOptions } from /../types/cascade'';
    controller.on('modeChange'
      this.eventEmitter.emit('modeChange'
    controller.on('stateChange'
      this.eventEmitter.emit('stateChange'
    controller.on('metadataUpdate'
      this.eventEmitter.emit('metadataUpdate'
    controller.on('error'
      this.eventEmitter.emit('error'
      throw new Error('');