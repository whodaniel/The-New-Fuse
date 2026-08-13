# TNF Exhaustive AST Map

```mermaid
flowchart LR
  classDef pkg fill:#2b6cb0,stroke:#1A365D,color:#fff,stroke-width:2px,rx:5px,ry:5px
  classDef file fill:#4299e1,stroke:#2b6cb0,color:#fff,stroke-width:1px,rx:3px,ry:3px
  classDef cls fill:#805ad5,stroke:#553C9A,color:#fff,stroke-width:2px,rx:5px,ry:5px
  classDef mth fill:#9f7aea,stroke:#805ad5,color:#fff,stroke-width:1px,rx:3px,ry:3px
  classDef tbl fill:#38a169,stroke:#22543D,color:#fff,stroke-width:2px,rx:5px,ry:5px

  TNF[The New Fuse Ecosystem]:::pkg
  N0[@the-new-fuse]:::pkg
  TNF --> N0
  N1[a2a-core]:::pkg
  TNF --> N1
  N2[File: a2a.controller.ts]:::file
  N1 --> N2
  N3[Class: A2AController]:::cls
  N2 --> N3
  N4[getOnlineAgents()]:::mth
  N3 --> N4
  N5[getSystemStats()]:::mth
  N3 --> N5
  N6[getConnectionStatus()]:::mth
  N3 --> N6
  N7[File: a2a.module.ts]:::file
  N1 --> N7
  N8[Class: A2ACoreModule]:::cls
  N7 --> N8
  N9[forRoot()]:::mth
  N8 --> N9
  N10[File: a2a.service.ts]:::file
  N1 --> N10
  N11[Class: A2AService]:::cls
  N10 --> N11
  N12[createPayment()]:::mth
  N11 --> N12
  N13[onModuleInit()]:::mth
  N11 --> N13
  N14[initializeService()]:::mth
  N11 --> N14
  N15[initializeDefaultRoutes()]:::mth
  N11 --> N15
  N16[registerAgent()]:::mth
  N11 --> N16
  N17[File: federated-identity.service.ts]:::file
  N1 --> N17
  N18[Class: FederatedIdentityService]:::cls
  N17 --> N18
  N19[generateIdNumber()]:::mth
  N18 --> N19
  N20[verifyAttribution()]:::mth
  N18 --> N20
  N21[encodeBase58()]:::mth
  N18 --> N21
  N23[File: pointer-resolver.service.ts]:::file
  N1 --> N23
  N24[Class: PointerResolverService]:::cls
  N23 --> N24
  N25[resolve()]:::mth
  N24 --> N25
  N26[resolvePgVector()]:::mth
  N24 --> N26
  N27[resolveFile()]:::mth
  N24 --> N27
  N28[resolveTrp()]:::mth
  N24 --> N28
  N29[File: redis-adapter.ts]:::file
  N1 --> N29
  N30[Class: A2ARedisAdapter]:::cls
  N29 --> N30
  N31[onModuleInit()]:::mth
  N30 --> N31
  N32[connected()]:::mth
  N30 --> N32
  N33[ensureConnected()]:::mth
  N30 --> N33
  N34[onModuleDestroy()]:::mth
  N30 --> N34
  N35[setupSubscriptions()]:::mth
  N30 --> N35
  N36[File: signature-wrapper.ts]:::file
  N1 --> N36
  N37[Class: A2ASignatureWrapper]:::cls
  N36 --> N37
  N38[wrap()]:::mth
  N37 --> N38
  N39[generateNonce()]:::mth
  N37 --> N39
  N41[File: types.ts]:::file
  N1 --> N41
  N42[Class: ProtoA2AError]:::cls
  N41 --> N42
  N43[toJSON()]:::mth
  N42 --> N43
  N44[registerAgent()]:::mth
  N42 --> N44
  N45[broadcast()]:::mth
  N42 --> N45
  N46[sendHeartbeat()]:::mth
  N42 --> N46
  N47[Class: ProtoA2AValidationError]:::cls
  N41 --> N47
  N48[toJSON()]:::mth
  N47 --> N48
  N49[registerAgent()]:::mth
  N47 --> N49
  N50[broadcast()]:::mth
  N47 --> N50
  N51[sendHeartbeat()]:::mth
  N47 --> N51
  N52[Class: ProtoA2ATimeoutError]:::cls
  N41 --> N52
  N53[toJSON()]:::mth
  N52 --> N53
  N54[registerAgent()]:::mth
  N52 --> N54
  N55[broadcast()]:::mth
  N52 --> N55
  N56[sendHeartbeat()]:::mth
  N52 --> N56
  N57[Class: ProtoA2AAuthenticationError]:::cls
  N41 --> N57
  N58[toJSON()]:::mth
  N57 --> N58
  N59[registerAgent()]:::mth
  N57 --> N59
  N60[broadcast()]:::mth
  N57 --> N60
  N61[sendHeartbeat()]:::mth
  N57 --> N61
  N62[Class: ProtoA2AAuthorizationError]:::cls
  N41 --> N62
  N63[toJSON()]:::mth
  N62 --> N63
  N64[registerAgent()]:::mth
  N62 --> N64
  N65[broadcast()]:::mth
  N62 --> N65
  N66[sendHeartbeat()]:::mth
  N62 --> N66
  N67[Class: ProtoA2ATaskNotFoundError]:::cls
  N41 --> N67
  N68[toJSON()]:::mth
  N67 --> N68
  N69[registerAgent()]:::mth
  N67 --> N69
  N70[broadcast()]:::mth
  N67 --> N70
  N71[sendHeartbeat()]:::mth
  N67 --> N71
  N72[Class: A2AError]:::cls
  N41 --> N72
  N73[toJSON()]:::mth
  N72 --> N73
  N74[registerAgent()]:::mth
  N72 --> N74
  N75[broadcast()]:::mth
  N72 --> N75
  N76[sendHeartbeat()]:::mth
  N72 --> N76
  N77[Class: A2AValidationError]:::cls
  N41 --> N77
  N78[toJSON()]:::mth
  N77 --> N78
  N79[registerAgent()]:::mth
  N77 --> N79
  N80[broadcast()]:::mth
  N77 --> N80
  N81[sendHeartbeat()]:::mth
  N77 --> N81
  N82[Class: A2ATimeoutError]:::cls
  N41 --> N82
  N83[toJSON()]:::mth
  N82 --> N83
  N84[registerAgent()]:::mth
  N82 --> N84
  N85[broadcast()]:::mth
  N82 --> N85
  N86[sendHeartbeat()]:::mth
  N82 --> N86
  N87[Class: A2AConnectionError]:::cls
  N41 --> N87
  N88[toJSON()]:::mth
  N87 --> N88
  N89[registerAgent()]:::mth
  N87 --> N89
  N90[broadcast()]:::mth
  N87 --> N90
  N91[sendHeartbeat()]:::mth
  N87 --> N91
  N92[File: websocket-adapter.ts]:::file
  N1 --> N92
  N93[Class: A2AWebSocketAdapter]:::cls
  N92 --> N93
  N94[setupRedisSubscriptions()]:::mth
  N93 --> N94
  N95[handleConnection()]:::mth
  N93 --> N95
  N96[handleDisconnect()]:::mth
  N93 --> N96
  N97[forwardMessageToWebSocket()]:::mth
  N93 --> N97
  N98[validateAgent()]:::mth
  N93 --> N98
  N101[a2a-protocol]:::pkg
  TNF --> N101
  N103[File: pi-synapse.ts]:::file
  N101 --> N103
  N104[Class: PiSynapseAdapter]:::cls
  N103 --> N104
  N105[getInternalMetrics()]:::mth
  N104 --> N105
  N106[a2a-react]:::pkg
  TNF --> N106
  N114[ag-ui-core]:::pkg
  TNF --> N114
  N115[File: nodejs-agent-example.ts]:::file
  N114 --> N115
  N116[Class: AGUIAgent]:::cls
  N115 --> N116
  N117[connect()]:::mth
  N116 --> N117
  N118[disconnect()]:::mth
  N116 --> N118
  N119[handleMessage()]:::mth
  N116 --> N119
  N120[sendRequest()]:::mth
  N116 --> N120
  N121[generateAgentFlowVisualization()]:::mth
  N116 --> N121
  N122[File: AGUIOrchestrator.ts]:::file
  N114 --> N122
  N123[Class: AGUIOrchestrator]:::cls
  N122 --> N123
  N124[start()]:::mth
  N123 --> N124
  N125[stop()]:::mth
  N123 --> N125
  N126[handleMessage()]:::mth
  N123 --> N126
  N127[sendResponse()]:::mth
  N123 --> N127
  N128[sendError()]:::mth
  N123 --> N128
  N130[File: AGUIModule.ts]:::file
  N114 --> N130
  N131[Class: AGUIModule]:::cls
  N130 --> N131
  N132[File: AGUIService.ts]:::file
  N114 --> N132
  N133[Class: AGUIService]:::cls
  N132 --> N133
  N134[onModuleInit()]:::mth
  N133 --> N134
  N135[onModuleDestroy()]:::mth
  N133 --> N135
  N136[getActiveSessions()]:::mth
  N133 --> N136
  N137[generateVisualization()]:::mth
  N133 --> N137
  N138[notifyAgent()]:::mth
  N133 --> N138
  N139[File: VisualizationGenerator.ts]:::file
  N114 --> N139
  N140[Class: VisualizationGenerator]:::cls
  N139 --> N140
  N141[generate()]:::mth
  N140 --> N141
  N142[agent]:::pkg
  TNF --> N142
  N145[File: RedisTransportAdapter.ts]:::file
  N142 --> N145
  N146[Class: RedisTransportAdapter]:::cls
  N145 --> N146
  N147[connect()]:::mth
  N146 --> N147
  N148[createRedisClient()]:::mth
  N146 --> N148
  N149[setupSubscriberHandlers()]:::mth
  N146 --> N149
  N150[send()]:::mth
  N146 --> N150
  N151[unsubscribe()]:::mth
  N146 --> N151
  N152[File: agent_sync_bridge.ts]:::file
  N142 --> N152
  N153[Class: AgentSyncBridge]:::cls
  N152 --> N153
  N154[connect()]:::mth
  N153 --> N154
  N155[disconnect()]:::mth
  N153 --> N155
  N156[sendMessage()]:::mth
  N153 --> N156
  N157[getState()]:::mth
  N153 --> N157
  N158[syncState()]:::mth
  N153 --> N158
  N159[File: base.ts]:::file
  N142 --> N159
  N160[Class: for]:::cls
  N159 --> N160
  N161[connect()]:::mth
  N160 --> N161
  N162[getConnected()]:::mth
  N160 --> N162
  N163[getStats()]:::mth
  N160 --> N163
  N164[createMessage()]:::mth
  N160 --> N164
  N165[sendMessage()]:::mth
  N160 --> N165
  N166[Class: for]:::cls
  N159 --> N166
  N167[connect()]:::mth
  N166 --> N167
  N168[getConnected()]:::mth
  N166 --> N168
  N169[getStats()]:::mth
  N166 --> N169
  N170[createMessage()]:::mth
  N166 --> N170
  N171[sendMessage()]:::mth
  N166 --> N171
  N172[Class: Bridge]:::cls
  N159 --> N172
  N173[connect()]:::mth
  N172 --> N173
  N174[getConnected()]:::mth
  N172 --> N174
  N175[getStats()]:::mth
  N172 --> N175
  N176[createMessage()]:::mth
  N172 --> N176
  N177[sendMessage()]:::mth
  N172 --> N177
  N179[File: bridge_adapter.ts]:::file
  N142 --> N179
  N180[Class: BridgeAdapter]:::cls
  N179 --> N180
  N181[registerBridge()]:::mth
  N180 --> N181
  N182[unregisterBridge()]:::mth
  N180 --> N182
  N183[createAdapter()]:::mth
  N180 --> N183
  N184[removeAdapter()]:::mth
  N180 --> N184
  N185[routeMessage()]:::mth
  N180 --> N185
  N186[File: cascade_bridge.ts]:::file
  N142 --> N186
  N187[Class: CascadeBridge]:::cls
  N186 --> N187
  N188[connect()]:::mth
  N187 --> N188
  N189[disconnect()]:::mth
  N187 --> N189
  N190[sendMessage()]:::mth
  N187 --> N190
  N191[createWorkflow()]:::mth
  N187 --> N191
  N192[executeStep()]:::mth
  N187 --> N192
  N193[File: communication.ts]:::file
  N142 --> N193
  N194[Class: CommunicationBridge]:::cls
  N193 --> N194
  N195[connect()]:::mth
  N194 --> N195
  N196[disconnect()]:::mth
  N194 --> N196
  N197[sendMessage()]:::mth
  N194 --> N197
  N198[createMsg()]:::mth
  N194 --> N198
  N199[send()]:::mth
  N194 --> N199
  N201[File: electron_bridge.ts]:::file
  N142 --> N201
  N202[Class: ElectronBridge]:::cls
  N201 --> N202
  N203[connect()]:::mth
  N202 --> N203
  N204[disconnect()]:::mth
  N202 --> N204
  N205[sendMessage()]:::mth
  N202 --> N205
  N206[send()]:::mth
  N202 --> N206
  N207[sendAndWait()]:::mth
  N202 --> N207
  N208[File: enhanced_communication.ts]:::file
  N142 --> N208
  N209[Class: PriorityQueue]:::cls
  N208 --> N209
  N210[enqueue()]:::mth
  N209 --> N210
  N211[dequeue()]:::mth
  N209 --> N211
  N212[peek()]:::mth
  N209 --> N212
  N213[size()]:::mth
  N209 --> N213
  N214[isEmpty()]:::mth
  N209 --> N214
  N215[Class: MessageBatcher]:::cls
  N208 --> N215
  N216[enqueue()]:::mth
  N215 --> N216
  N217[dequeue()]:::mth
  N215 --> N217
  N218[peek()]:::mth
  N215 --> N218
  N219[size()]:::mth
  N215 --> N219
  N220[isEmpty()]:::mth
  N215 --> N220
  N221[Class: RateLimiter]:::cls
  N208 --> N221
  N222[enqueue()]:::mth
  N221 --> N222
  N223[dequeue()]:::mth
  N221 --> N223
  N224[peek()]:::mth
  N221 --> N224
  N225[size()]:::mth
  N221 --> N225
  N226[isEmpty()]:::mth
  N221 --> N226
  N227[Class: RetryHandler]:::cls
  N208 --> N227
  N228[enqueue()]:::mth
  N227 --> N228
  N229[dequeue()]:::mth
  N227 --> N229
  N230[peek()]:::mth
  N227 --> N230
  N231[size()]:::mth
  N227 --> N231
  N232[isEmpty()]:::mth
  N227 --> N232
  N233[Class: EnhancedCommunication]:::cls
  N208 --> N233
  N234[enqueue()]:::mth
  N233 --> N234
  N235[dequeue()]:::mth
  N233 --> N235
  N236[peek()]:::mth
  N233 --> N236
  N237[size()]:::mth
  N233 --> N237
  N238[isEmpty()]:::mth
  N233 --> N238
  N239[File: index.ts]:::file
  N142 --> N239
  N240[Class: BaseBridge]:::cls
  N239 --> N240
  N241[connect()]:::mth
  N240 --> N241
  N242[bridgeName()]:::mth
  N240 --> N242
  N243[File: mcp_bridge.ts]:::file
  N142 --> N243
  N244[Class: MCPBridge]:::cls
  N243 --> N244
  N245[MCP()]:::mth
  N244 --> N245
  N246[connect()]:::mth
  N244 --> N246
  N247[disconnect()]:::mth
  N244 --> N247
  N248[sendMessage()]:::mth
  N244 --> N248
  N249[getServerInfo()]:::mth
  N244 --> N249
  N250[File: monitor_bridge.ts]:::file
  N142 --> N250
  N251[Class: MonitorBridge]:::cls
  N250 --> N251
  N252[connect()]:::mth
  N251 --> N252
  N253[disconnect()]:::mth
  N251 --> N253
  N254[sendMessage()]:::mth
  N251 --> N254
  N255[registerAgent()]:::mth
  N251 --> N255
  N256[updateAgent()]:::mth
  N251 --> N256
  N257[File: monitor_communication.ts]:::file
  N142 --> N257
  N258[Class: MonitorCommunication]:::cls
  N257 --> N258
  N259[trackMessage()]:::mth
  N258 --> N259
  N260[trackLatency()]:::mth
  N258 --> N260
  N261[trackError()]:::mth
  N258 --> N261
  N262[getStats()]:::mth
  N258 --> N262
  N263[getAgentPattern()]:::mth
  N258 --> N263
  N264[File: protocol_bridge.ts]:::file
  N142 --> N264
  N265[Class: ProtocolBridge]:::cls
  N264 --> N265
  N266[connect()]:::mth
  N265 --> N266
  N267[disconnect()]:::mth
  N265 --> N267
  N268[sendMessage()]:::mth
  N265 --> N268
  N269[send()]:::mth
  N265 --> N269
  N270[sendAndWait()]:::mth
  N265 --> N270
  N271[File: redis_bridge.ts]:::file
  N142 --> N271
  N272[Class: RedisTransportAdapter]:::cls
  N271 --> N272
  N273[publish()]:::mth
  N272 --> N273
  N274[connect()]:::mth
  N272 --> N274
  N275[disconnect()]:::mth
  N272 --> N275
  N276[send()]:::mth
  N272 --> N276
  N277[unsubscribe()]:::mth
  N272 --> N277
  N278[File: system_bridge.ts]:::file
  N142 --> N278
  N279[Class: SystemBridge]:::cls
  N278 --> N279
  N280[connect()]:::mth
  N279 --> N280
  N281[disconnect()]:::mth
  N279 --> N281
  N282[sendMessage()]:::mth
  N279 --> N282
  N283[collectMetrics()]:::mth
  N279 --> N283
  N284[startMetricsCollection()]:::mth
  N279 --> N284
  N292[File: universal_bridge.ts]:::file
  N142 --> N292
  N293[Class: for]:::cls
  N292 --> N293
  N294[connect()]:::mth
  N293 --> N294
  N295[connect()]:::mth
  N293 --> N295
  N296[disconnect()]:::mth
  N293 --> N296
  N297[send()]:::mth
  N293 --> N297
  N298[unsubscribe()]:::mth
  N293 --> N298
  N299[Class: MemoryTransportAdapter]:::cls
  N292 --> N299
  N300[connect()]:::mth
  N299 --> N300
  N301[connect()]:::mth
  N299 --> N301
  N302[disconnect()]:::mth
  N299 --> N302
  N303[send()]:::mth
  N299 --> N303
  N304[unsubscribe()]:::mth
  N299 --> N304
  N305[Class: WebSocketTransportAdapter]:::cls
  N292 --> N305
  N306[connect()]:::mth
  N305 --> N306
  N307[connect()]:::mth
  N305 --> N307
  N308[disconnect()]:::mth
  N305 --> N308
  N309[send()]:::mth
  N305 --> N309
  N310[unsubscribe()]:::mth
  N305 --> N310
  N311[Class: UniversalBridge]:::cls
  N292 --> N311
  N312[connect()]:::mth
  N311 --> N312
  N313[connect()]:::mth
  N311 --> N313
  N314[disconnect()]:::mth
  N311 --> N314
  N315[send()]:::mth
  N311 --> N315
  N316[unsubscribe()]:::mth
  N311 --> N316
  N318[File: vscode_bridge.ts]:::file
  N142 --> N318
  N319[Class: VSCodeBridge]:::cls
  N318 --> N319
  N320[connect()]:::mth
  N319 --> N320
  N321[disconnect()]:::mth
  N319 --> N321
  N322[sendMessage()]:::mth
  N319 --> N322
  N323[executeCommand()]:::mth
  N319 --> N323
  N324[getEditorContext()]:::mth
  N319 --> N324
  N325[File: manager.ts]:::file
  N142 --> N325
  N326[Class: ContextManager]:::cls
  N325 --> N326
  N327[store()]:::mth
  N326 --> N327
  N328[retrieve()]:::mth
  N326 --> N328
  N329[update()]:::mth
  N326 --> N329
  N330[remove()]:::mth
  N326 --> N330
  N331[clear()]:::mth
  N326 --> N331
  N332[File: AgentProcessor.ts]:::file
  N142 --> N332
  N333[Class: AgentProcessor]:::cls
  N332 --> N333
  N334[processMessage()]:::mth
  N333 --> N334
  N335[start()]:::mth
  N333 --> N335
  N336[stop()]:::mth
  N333 --> N336
  N337[File: AgentSystem.ts]:::file
  N142 --> N337
  N338[Class: AgentSystem]:::cls
  N337 --> N338
  N339[File: BaseAgent.ts]:::file
  N142 --> N339
  N340[Class: BaseAgent]:::cls
  N339 --> N340
  N341[processMessage()]:::mth
  N340 --> N341
  N342[handleError()]:::mth
  N340 --> N342
  N343[start()]:::mth
  N340 --> N343
  N344[stop()]:::mth
  N340 --> N344
  N345[terminate()]:::mth
  N340 --> N345
  N346[File: BaseService.ts]:::file
  N142 --> N346
  N347[Class: providing]:::cls
  N346 --> N347
  N348[initialize()]:::mth
  N347 --> N348
  N349[start()]:::mth
  N347 --> N349
  N350[stop()]:::mth
  N347 --> N350
  N351[getStatus()]:::mth
  N347 --> N351
  N352[running()]:::mth
  N347 --> N352
  N353[Class: BaseService]:::cls
  N346 --> N353
  N354[initialize()]:::mth
  N353 --> N354
  N355[start()]:::mth
  N353 --> N355
  N356[stop()]:::mth
  N353 --> N356
  N357[getStatus()]:::mth
  N353 --> N357
  N358[running()]:::mth
  N353 --> N358
  N359[File: recovery.ts]:::file
  N142 --> N359
  N360[Class: ErrorRecovery]:::cls
  N359 --> N360
  N361[handleError()]:::mth
  N360 --> N361
  N362[registerStrategy()]:::mth
  N360 --> N362
  N363[findStrategy()]:::mth
  N360 --> N363
  N364[addToHistory()]:::mth
  N360 --> N364
  N365[initializeDefaultStrategies()]:::mth
  N360 --> N365
  N366[File: cascade_agent.ts]:::file
  N142 --> N366
  N367[Class: CascadeAgent]:::cls
  N366 --> N367
  N368[initialize()]:::mth
  N367 --> N368
  N369[process()]:::mth
  N367 --> N369
  N370[learn()]:::mth
  N367 --> N370
  N371[saveToMemory()]:::mth
  N367 --> N371
  N372[retrieveFromMemory()]:::mth
  N367 --> N372
  N373[File: cline_agent.ts]:::file
  N142 --> N373
  N374[Class: ClineAgent]:::cls
  N373 --> N374
  N375[initialize()]:::mth
  N374 --> N375
  N376[process()]:::mth
  N374 --> N376
  N377[learn()]:::mth
  N374 --> N377
  N378[saveToMemory()]:::mth
  N374 --> N378
  N379[retrieveFromMemory()]:::mth
  N374 --> N379
  N380[File: enhanced_agent.ts]:::file
  N142 --> N380
  N381[Class: EnhancedAgent]:::cls
  N380 --> N381
  N382[start()]:::mth
  N381 --> N382
  N383[stop()]:::mth
  N381 --> N383
  N384[getStatus()]:::mth
  N381 --> N384
  N385[processMessage()]:::mth
  N381 --> N385
  N386[createContext()]:::mth
  N381 --> N386
  N387[File: example_agent.ts]:::file
  N142 --> N387
  N388[Class: ExampleAgent]:::cls
  N387 --> N388
  N389[start()]:::mth
  N388 --> N389
  N390[stop()]:::mth
  N388 --> N390
  N391[isRunning()]:::mth
  N388 --> N391
  N392[process()]:::mth
  N388 --> N392
  N393[greet()]:::mth
  N388 --> N393
  N395[File: interactive_agent.ts]:::file
  N142 --> N395
  N396[Class: InteractiveAgent]:::cls
  N395 --> N396
  N397[initialize()]:::mth
  N396 --> N397
  N398[process()]:::mth
  N396 --> N398
  N399[learn()]:::mth
  N396 --> N399
  N400[saveToMemory()]:::mth
  N396 --> N400
  N401[retrieveFromMemory()]:::mth
  N396 --> N401
  N402[File: llm_chat_agent.ts]:::file
  N142 --> N402
  N403[Class: LLMChatAgent]:::cls
  N402 --> N403
  N404[initialize()]:::mth
  N403 --> N404
  N405[process()]:::mth
  N403 --> N405
  N406[learn()]:::mth
  N403 --> N406
  N407[saveToMemory()]:::mth
  N403 --> N407
  N408[retrieveFromMemory()]:::mth
  N403 --> N408
  N409[File: research_agent.ts]:::file
  N142 --> N409
  N410[Class: ResearchAgent]:::cls
  N409 --> N410
  N411[initialize()]:::mth
  N410 --> N411
  N412[process()]:::mth
  N410 --> N412
  N413[learn()]:::mth
  N410 --> N413
  N414[saveToMemory()]:::mth
  N410 --> N414
  N415[retrieveFromMemory()]:::mth
  N410 --> N415
  N416[File: simple_enhanced_agent.ts]:::file
  N142 --> N416
  N417[Class: SimpleEnhancedAgent]:::cls
  N416 --> N417
  N418[start()]:::mth
  N417 --> N418
  N419[stop()]:::mth
  N417 --> N419
  N420[isRunning()]:::mth
  N417 --> N420
  N421[chat()]:::mth
  N417 --> N421
  N422[checkToolInvocations()]:::mth
  N417 --> N422
  N423[File: unified_agent.ts]:::file
  N142 --> N423
  N424[Class: UnifiedAgent]:::cls
  N423 --> N424
  N425[start()]:::mth
  N424 --> N425
  N426[stop()]:::mth
  N424 --> N426
  N427[getInfo()]:::mth
  N424 --> N427
  N428[getState()]:::mth
  N424 --> N428
  N429[submitTask()]:::mth
  N424 --> N429
  N430[File: workflow_agent.ts]:::file
  N142 --> N430
  N431[Class: WorkflowAgent]:::cls
  N430 --> N431
  N432[initialize()]:::mth
  N431 --> N432
  N433[process()]:::mth
  N431 --> N433
  N434[learn()]:::mth
  N431 --> N434
  N435[saveToMemory()]:::mth
  N431 --> N435
  N436[retrieveFromMemory()]:::mth
  N431 --> N436
  N439[File: metrics.ts]:::file
  N142 --> N439
  N440[Class: MetricsRegistry]:::cls
  N439 --> N440
  N441[increment()]:::mth
  N440 --> N441
  N442[set()]:::mth
  N440 --> N442
  N443[start()]:::mth
  N440 --> N443
  N444[counter()]:::mth
  N440 --> N444
  N445[gauge()]:::mth
  N440 --> N445
  N446[Class: PerformanceMonitor]:::cls
  N439 --> N446
  N447[increment()]:::mth
  N446 --> N447
  N448[set()]:::mth
  N446 --> N448
  N449[start()]:::mth
  N446 --> N449
  N450[counter()]:::mth
  N446 --> N450
  N451[gauge()]:::mth
  N446 --> N451
  N452[File: BaseProcessor.ts]:::file
  N142 --> N452
  N453[Class: for]:::cls
  N452 --> N453
  N454[process()]:::mth
  N453 --> N454
  N455[debug()]:::mth
  N453 --> N455
  N456[logError()]:::mth
  N453 --> N456
  N457[Class: BaseProcessor]:::cls
  N452 --> N457
  N458[process()]:::mth
  N457 --> N458
  N459[debug()]:::mth
  N457 --> N459
  N460[logError()]:::mth
  N457 --> N460
  N461[Class: constructor]:::cls
  N452 --> N461
  N462[process()]:::mth
  N461 --> N462
  N463[debug()]:::mth
  N461 --> N463
  N464[logError()]:::mth
  N461 --> N464
  N465[File: ProtocolRegistry.ts]:::file
  N142 --> N465
  N466[Class: ProtocolRegistry]:::cls
  N465 --> N466
  N467[registerProtocol()]:::mth
  N466 --> N467
  N468[getProtocol()]:::mth
  N466 --> N468
  N469[listProtocols()]:::mth
  N466 --> N469
  N470[File: WebSocketCommunicationProtocol.ts]:::file
  N142 --> N470
  N471[Class: WebSocketCommunicationProtocol]:::cls
  N470 --> N471
  N472[send()]:::mth
  N471 --> N472
  N473[registerAgent()]:::mth
  N471 --> N473
  N474[setup()]:::mth
  N471 --> N474
  N475[registerAgent()]:::mth
  N471 --> N475
  N476[unregisterAgent()]:::mth
  N471 --> N476
  N478[File: redis-agent-registry.ts]:::file
  N142 --> N478
  N479[Class: RedisAgentRegistry]:::cls
  N478 --> N479
  N480[connect()]:::mth
  N479 --> N480
  N481[disconnect()]:::mth
  N479 --> N481
  N482[register()]:::mth
  N479 --> N482
  N483[updateHeartbeat()]:::mth
  N479 --> N483
  N484[unregister()]:::mth
  N479 --> N484
  N485[File: ConfigService.ts]:::file
  N142 --> N485
  N486[Class: ConfigService]:::cls
  N485 --> N486
  N487[set()]:::mth
  N486 --> N487
  N488[has()]:::mth
  N486 --> N488
  N489[getAll()]:::mth
  N486 --> N489
  N490[update()]:::mth
  N486 --> N490
  N491[getRedisConfig()]:::mth
  N486 --> N491
  N492[File: MessageValidator.ts]:::file
  N142 --> N492
  N493[Class: MessageValidator]:::cls
  N492 --> N493
  N494[addSchema()]:::mth
  N493 --> N494
  N495[validate()]:::mth
  N493 --> N495
  N496[sanitizeMessageForLog()]:::mth
  N493 --> N496
  N497[getLastErrors()]:::mth
  N493 --> N497
  N498[File: core.ts]:::file
  N142 --> N498
  N499[Class: Logger]:::cls
  N498 --> N499
  N500[info()]:::mth
  N499 --> N500
  N501[log()]:::mth
  N499 --> N501
  N502[error()]:::mth
  N499 --> N502
  N503[warn()]:::mth
  N499 --> N503
  N504[debug()]:::mth
  N499 --> N504
  N507[File: MessageValidator.ts]:::file
  N142 --> N507
  N508[Class: MessageValidator]:::cls
  N507 --> N508
  N509[addSchema()]:::mth
  N508 --> N509
  N510[validate()]:::mth
  N508 --> N510
  N511[sanitizeMessageForLog()]:::mth
  N508 --> N511
  N512[getLastErrors()]:::mth
  N508 --> N512
  N513[agent-coordination]:::pkg
  TNF --> N513
  N515[File: broadcast-manager.ts]:::file
  N513 --> N515
  N516[Class: BroadcastManager]:::cls
  N515 --> N516
  N517[broadcast()]:::mth
  N516 --> N517
  N518[subscribe()]:::mth
  N516 --> N518
  N519[subscribePattern()]:::mth
  N516 --> N519
  N520[unsubscribe()]:::mth
  N516 --> N520
  N521[unsubscribePattern()]:::mth
  N516 --> N521
  N522[File: RecoveryManager.ts]:::file
  N513 --> N522
  N523[Class: RecoveryManager]:::cls
  N522 --> N523
  N524[startMonitoring()]:::mth
  N523 --> N524
  N525[stopMonitoring()]:::mth
  N523 --> N525
  N526[performHealthCheck()]:::mth
  N523 --> N526
  N527[detectOfflineAgents()]:::mth
  N523 --> N527
  N528[recoverAgent()]:::mth
  N523 --> N528
  N529[File: shared-state-manager.ts]:::file
  N513 --> N529
  N530[Class: SharedStateManager]:::cls
  N529 --> N530
  N531[setState()]:::mth
  N530 --> N531
  N532[getState()]:::mth
  N530 --> N532
  N533[deleteState()]:::mth
  N530 --> N533
  N534[acquireLock()]:::mth
  N530 --> N534
  N535[releaseLock()]:::mth
  N530 --> N535
  N536[File: AgentPool.ts]:::file
  N513 --> N536
  N537[Class: AgentPool]:::cls
  N536 --> N537
  N538[registerAgent()]:::mth
  N537 --> N538
  N539[unregisterAgent()]:::mth
  N537 --> N539
  N540[getAgent()]:::mth
  N537 --> N540
  N541[getAllAgents()]:::mth
  N537 --> N541
  N542[getAgentsByStatus()]:::mth
  N537 --> N542
  N543[File: TaskAssigner.ts]:::file
  N513 --> N543
  N544[Class: TaskAssigner]:::cls
  N543 --> N544
  N545[assignTask()]:::mth
  N544 --> N545
  N546[filterEligibleAgents()]:::mth
  N544 --> N546
  N547[selectAgent()]:::mth
  N544 --> N547
  N548[selectLeastLoadedAgent()]:::mth
  N544 --> N548
  N549[selectRoundRobinAgent()]:::mth
  N544 --> N549
  N550[File: TaskQueue.ts]:::file
  N513 --> N550
  N551[Class: TaskQueue]:::cls
  N550 --> N551
  N552[initializeQueues()]:::mth
  N551 --> N552
  N553[addTask()]:::mth
  N551 --> N553
  N554[getNextTask()]:::mth
  N551 --> N554
  N555[getTask()]:::mth
  N551 --> N555
  N556[updateTaskStatus()]:::mth
  N551 --> N556
  N561[File: ActivityMonitor.ts]:::file
  N513 --> N561
  N562[Class: ActivityMonitor]:::cls
  N561 --> N562
  N563[setupEventListeners()]:::mth
  N562 --> N563
  N564[start()]:::mth
  N562 --> N564
  N565[stop()]:::mth
  N562 --> N565
  N566[logActivity()]:::mth
  N562 --> N566
  N567[checkSystemHealth()]:::mth
  N562 --> N567
  N568[File: MetricsCollector.ts]:::file
  N513 --> N568
  N569[Class: MetricsCollector]:::cls
  N568 --> N569
  N570[recordTaskStarted()]:::mth
  N569 --> N570
  N571[recordTaskCompleted()]:::mth
  N569 --> N571
  N572[recordTaskFailed()]:::mth
  N569 --> N572
  N573[addToHistory()]:::mth
  N569 --> N573
  N574[getCurrentMetrics()]:::mth
  N569 --> N574
  N575[File: PersistentMetricsCollector.ts]:::file
  N513 --> N575
  N576[Class: PersistentMetricsCollector]:::cls
  N575 --> N576
  N577[recordTaskCreated()]:::mth
  N576 --> N577
  N578[recordTaskCompleted()]:::mth
  N576 --> N578
  N579[recordTaskFailed()]:::mth
  N576 --> N579
  N580[getSystemMetrics()]:::mth
  N576 --> N580
  N581[getAgentMetrics()]:::mth
  N576 --> N581
  N583[File: Coordinator.ts]:::file
  N513 --> N583
  N584[Class: Coordinator]:::cls
  N583 --> N584
  N585[setupEventHandlers()]:::mth
  N584 --> N585
  N586[start()]:::mth
  N584 --> N586
  N587[stop()]:::mth
  N584 --> N587
  N588[submitTask()]:::mth
  N584 --> N588
  N589[submitTasks()]:::mth
  N584 --> N589
  N590[File: TaskDecomposer.ts]:::file
  N513 --> N590
  N591[Class: TaskDecomposer]:::cls
  N590 --> N591
  N592[decompose()]:::mth
  N591 --> N592
  N593[registerStrategy()]:::mth
  N591 --> N593
  N594[decompose()]:::mth
  N591 --> N594
  N595[decomposeParallel()]:::mth
  N591 --> N595
  N596[decomposeSequential()]:::mth
  N591 --> N596
  N598[File: ConsensusPattern.ts]:::file
  N513 --> N598
  N599[Class: ConsensusPattern]:::cls
  N598 --> N599
  N600[propose()]:::mth
  N599 --> N600
  N601[vote()]:::mth
  N599 --> N601
  N602[requestVotes()]:::mth
  N599 --> N602
  N603[evaluate()]:::mth
  N599 --> N603
  N604[evaluateWeighted()]:::mth
  N599 --> N604
  N605[File: MapReducePattern.ts]:::file
  N513 --> N605
  N606[Class: MapReducePattern]:::cls
  N605 --> N606
  N607[execute()]:::mth
  N606 --> N607
  N608[createMapTasks()]:::mth
  N606 --> N608
  N609[waitForMapResults()]:::mth
  N606 --> N609
  N610[storeMapResult()]:::mth
  N606 --> N610
  N611[clear()]:::mth
  N606 --> N611
  N612[File: PipelinePattern.ts]:::file
  N513 --> N612
  N613[Class: PipelinePattern]:::cls
  N612 --> N613
  N614[storeStageResult()]:::mth
  N613 --> N614
  N615[getStageResult()]:::mth
  N613 --> N615
  N616[getAllStageResults()]:::mth
  N613 --> N616
  N617[clear()]:::mth
  N613 --> N617
  N618[File: SwarmPattern.ts]:::file
  N513 --> N618
  N619[Class: SwarmPattern]:::cls
  N618 --> N619
  N620[initialize()]:::mth
  N619 --> N620
  N621[waitForSolution()]:::mth
  N619 --> N621
  N622[getNeighborSolutions()]:::mth
  N619 --> N622
  N623[shareSolutions()]:::mth
  N619 --> N623
  N624[pruneOldSolutions()]:::mth
  N619 --> N624
  N626[File: presence-tracker.ts]:::file
  N513 --> N626
  N627[Class: PresenceTracker]:::cls
  N626 --> N627
  N628[registerAgent()]:::mth
  N627 --> N628
  N629[unregisterAgent()]:::mth
  N627 --> N629
  N630[updateStatus()]:::mth
  N627 --> N630
  N631[getPresence()]:::mth
  N627 --> N631
  N632[getActiveAgents()]:::mth
  N627 --> N632
  N633[File: task-queue-manager.ts]:::file
  N513 --> N633
  N634[Class: TaskQueueManager]:::cls
  N633 --> N634
  N635[createQueue()]:::mth
  N634 --> N635
  N636[registerProcessor()]:::mth
  N634 --> N636
  N637[addTask()]:::mth
  N634 --> N637
  N638[getTaskStatus()]:::mth
  N634 --> N638
  N639[cancelTask()]:::mth
  N634 --> N639
  N640[File: redis-coordinator.ts]:::file
  N513 --> N640
  N641[Class: RedisCoordinator]:::cls
  N640 --> N641
  N642[onModuleInit()]:::mth
  N641 --> N642
  N643[onModuleDestroy()]:::mth
  N641 --> N643
  N644[registerAgent()]:::mth
  N641 --> N644
  N645[unregisterAgent()]:::mth
  N641 --> N645
  N646[updateAgentStatus()]:::mth
  N641 --> N646
  N647[File: message-serializer.ts]:::file
  N513 --> N647
  N648[Class: MessageSerializer]:::cls
  N647 --> N648
  N649[getFormat()]:::mth
  N648 --> N649
  N650[setFormat()]:::mth
  N648 --> N650
  N651[File: ConflictResolver.ts]:::file
  N513 --> N651
  N652[Class: ConflictResolver]:::cls
  N651 --> N652
  N653[registerResolver()]:::mth
  N652 --> N653
  N654[isObject()]:::mth
  N652 --> N654
  N655[matchesPattern()]:::mth
  N652 --> N655
  N656[getVersion()]:::mth
  N652 --> N656
  N657[incrementVersion()]:::mth
  N652 --> N657
  N658[File: DistributedLock.ts]:::file
  N513 --> N658
  N659[Class: DistributedLock]:::cls
  N658 --> N659
  N660[acquire()]:::mth
  N659 --> N660
  N661[tryAcquire()]:::mth
  N659 --> N661
  N662[release()]:::mth
  N659 --> N662
  N663[extend()]:::mth
  N659 --> N663
  N664[isLocked()]:::mth
  N659 --> N664
  N665[File: SharedCache.ts]:::file
  N513 --> N665
  N666[Class: SharedCache]:::cls
  N665 --> N666
  N667[set()]:::mth
  N666 --> N667
  N668[delete()]:::mth
  N666 --> N668
  N669[exists()]:::mth
  N666 --> N669
  N670[mset()]:::mth
  N666 --> N670
  N671[increment()]:::mth
  N666 --> N671
  N677[ap2-protocol]:::pkg
  TNF --> N677
  N678[File: ap2-protocol.controller.ts]:::file
  N677 --> N678
  N679[Class: Ap2ProtocolController]:::cls
  N678 --> N679
  N680[getHealth()]:::mth
  N679 --> N680
  N681[File: ap2-protocol.module.ts]:::file
  N677 --> N681
  N682[Class: Ap2ProtocolModule]:::cls
  N681 --> N682
  N683[File: ap2-protocol.service.ts]:::file
  N677 --> N683
  N684[Class: Ap2ProtocolService]:::cls
  N683 --> N684
  N685[createPayment()]:::mth
  N684 --> N685
  N688[api]:::pkg
  TNF --> N688
  N689[File: app.module.ts]:::file
  N688 --> N689
  N690[Class: AppModule]:::cls
  N689 --> N690
  N691[configure()]:::mth
  N690 --> N691
  N692[File: jwt-auth.guard.ts]:::file
  N688 --> N692
  N693[Class: JwtAuthGuard]:::cls
  N692 --> N693
  N694[AuthGuard()]:::mth
  N693 --> N694
  N695[canActivate()]:::mth
  N693 --> N695
  N696[handleRequest()]:::mth
  N693 --> N696
  N699[File: AgentController.ts]:::file
  N688 --> N699
  N700[Class: AgentController]:::cls
  N699 --> N700
  N701[File: ConsolidatedApiController.ts]:::file
  N688 --> N701
  N702[Class: ConsolidatedApiController]:::cls
  N701 --> N702
  N703[getRecentActivityCount()]:::mth
  N702 --> N703
  N704[getSystemHealth()]:::mth
  N702 --> N704
  N705[getPerformanceMetrics()]:::mth
  N702 --> N705
  N706[File: admin-audit-logs.controller.ts]:::file
  N688 --> N706
  N707[Class: AdminAuditLogsController]:::cls
  N706 --> N707
  N708[Date()]:::mth
  N707 --> N708
  N709[Date()]:::mth
  N707 --> N709
  N710[File: admin-config.controller.ts]:::file
  N688 --> N710
  N711[Class: AdminConfigController]:::cls
  N710 --> N711
  N712[File: admin-metrics.controller.ts]:::file
  N688 --> N712
  N713[Class: AdminMetricsController]:::cls
  N712 --> N713
  N714[File: admin-settings.controller.ts]:::file
  N688 --> N714
  N715[Class: AdminSettingsController]:::cls
  N714 --> N715
  N716[File: auth.controller.ts]:::file
  N688 --> N716
  N717[Class: LoginDto]:::cls
  N716 --> N717
  N718[generateTokens()]:::mth
  N717 --> N718
  N719[Class: RegisterDto]:::cls
  N716 --> N719
  N720[generateTokens()]:::mth
  N719 --> N720
  N721[Class: RefreshTokenDto]:::cls
  N716 --> N721
  N722[generateTokens()]:::mth
  N721 --> N722
  N723[Class: AuthController]:::cls
  N716 --> N723
  N724[generateTokens()]:::mth
  N723 --> N724
  N725[File: export.controller.ts]:::file
  N688 --> N725
  N726[Class: ExportConversationDto]:::cls
  N725 --> N726
  N727[Class: ExportController]:::cls
  N725 --> N727
  N728[File: health.controller.ts]:::file
  N688 --> N728
  N729[Class: HealthController]:::cls
  N728 --> N729
  N730[check()]:::mth
  N729 --> N730
  N733[File: agent.dto.ts]:::file
  N688 --> N733
  N734[Class: CreateAgentDto]:::cls
  N733 --> N734
  N735[Class: UpdateAgentDto]:::cls
  N733 --> N735
  N736[Class: AgentResponseDto]:::cls
  N733 --> N736
  N737[File: all-exceptions.filter.ts]:::file
  N688 --> N737
  N738[Class: AllExceptionsFilter]:::cls
  N737 --> N738
  N739[File: global-exception.filter.ts]:::file
  N688 --> N739
  N740[Class: GlobalExceptionFilter]:::cls
  N739 --> N740
  N741[File: rate-limit.guard.ts]:::file
  N688 --> N741
  N742[Class: RateLimitGuard]:::cls
  N741 --> N742
  N743[getTracker()]:::mth
  N742 --> N743
  N744[getErrorMessage()]:::mth
  N742 --> N744
  N746[File: performance.interceptor.ts]:::file
  N688 --> N746
  N747[Class: PerformanceInterceptor]:::cls
  N746 --> N747
  N748[intercept()]:::mth
  N747 --> N748
  N750[File: mcp-broker.service.ts]:::file
  N688 --> N750
  N751[Class: MCPBrokerService]:::cls
  N750 --> N751
  N752[initialize()]:::mth
  N751 --> N752
  N753[cleanup()]:::mth
  N751 --> N753
  N754[registerServer()]:::mth
  N751 --> N754
  N755[getServers()]:::mth
  N751 --> N755
  N756[getServerStatus()]:::mth
  N751 --> N756
  N758[File: error.middleware.ts]:::file
  N688 --> N758
  N759[Class: for]:::cls
  N758 --> N759
  N760[errorMiddleware()]:::mth
  N759 --> N760
  N761[Class: ApiError]:::cls
  N758 --> N761
  N762[errorMiddleware()]:::mth
  N761 --> N762
  N763[File: request-logger.middleware.ts]:::file
  N688 --> N763
  N764[Class: RequestLoggerMiddleware]:::cls
  N763 --> N764
  N765[use()]:::mth
  N764 --> N765
  N767[File: admin.module.ts]:::file
  N688 --> N767
  N768[Class: AdminModule]:::cls
  N767 --> N768
  N769[File: agent.module.ts]:::file
  N688 --> N769
  N770[Class: AgentModule]:::cls
  N769 --> N770
  N771[File: auth.module.ts]:::file
  N688 --> N771
  N772[Class: AuthModule]:::cls
  N771 --> N772
  N773[File: api-key-auth.guard.ts]:::file
  N688 --> N773
  N774[Class: ApiKeyAuthGuard]:::cls
  N773 --> N774
  N775[canActivate()]:::mth
  N774 --> N775
  N776[extractApiKey()]:::mth
  N774 --> N776
  N777[validateApiKey()]:::mth
  N774 --> N777
  N778[File: jwt-auth.guard.ts]:::file
  N688 --> N778
  N779[Class: JwtAuthGuard]:::cls
  N778 --> N779
  N780[AuthGuard()]:::mth
  N779 --> N780
  N781[canActivate()]:::mth
  N779 --> N781
  N782[File: service-or-user-auth.guard.ts]:::file
  N688 --> N782
  N783[Class: ServiceOrUserAuthGuard]:::cls
  N782 --> N783
  N784[canActivate()]:::mth
  N783 --> N784
  N785[File: jwt.strategy.ts]:::file
  N688 --> N785
  N786[Class: JwtStrategy]:::cls
  N785 --> N786
  N787[PassportStrategy()]:::mth
  N786 --> N787
  N788[validate()]:::mth
  N786 --> N788
  N789[File: base.controller.ts]:::file
  N688 --> N789
  N790[Class: BaseController]:::cls
  N789 --> N790
  N791[File: agent-validation.dto.ts]:::file
  N688 --> N791
  N792[Class: CreateAgentDtoZod]:::cls
  N791 --> N792
  N793[Class: UpdateAgentDtoZod]:::cls
  N791 --> N793
  N794[File: agent.dto.ts]:::file
  N688 --> N794
  N795[Class: for]:::cls
  N794 --> N795
  N796[Class: AgentDto]:::cls
  N794 --> N796
  N797[File: create-agent.dto.ts]:::file
  N688 --> N797
  N798[Class: CreateAgentDto]:::cls
  N797 --> N798
  N799[File: create-workflow.dto.ts]:::file
  N688 --> N799
  N800[Class: CreateWorkflowDto]:::cls
  N799 --> N800
  N802[File: message.dto.ts]:::file
  N688 --> N802
  N803[Class: for]:::cls
  N802 --> N803
  N804[Class: MessageDto]:::cls
  N802 --> N804
  N805[File: swagger-dto.ts]:::file
  N688 --> N805
  N806[Class: versions]:::cls
  N805 --> N806
  N807[Class: for]:::cls
  N805 --> N807
  N808[Class: WorkflowDto]:::cls
  N805 --> N808
  N809[Class: for]:::cls
  N805 --> N809
  N810[Class: WorkflowExecutionDto]:::cls
  N805 --> N810
  N811[Class: for]:::cls
  N805 --> N811
  N812[Class: AgentDto]:::cls
  N805 --> N812
  N813[File: update-agent.dto.ts]:::file
  N688 --> N813
  N814[Class: UpdateAgentDto]:::cls
  N813 --> N814
  N815[File: update-workflow.dto.ts]:::file
  N688 --> N815
  N816[Class: UpdateWorkflowDto]:::cls
  N815 --> N816
  N817[File: workflow.dto.ts]:::file
  N688 --> N817
  N818[Class: for]:::cls
  N817 --> N818
  N819[Class: WorkflowDto]:::cls
  N817 --> N819
  N820[Class: for]:::cls
  N817 --> N820
  N821[Class: WorkflowExecutionDto]:::cls
  N817 --> N821
  N822[File: workflow.controller.ts]:::file
  N688 --> N822
  N823[Class: WorkflowController]:::cls
  N822 --> N823
  N825[File: export.module.ts]:::file
  N688 --> N825
  N826[Class: ExportModule]:::cls
  N825 --> N826
  N827[File: jwt-auth.guard.ts]:::file
  N688 --> N827
  N828[Class: JwtAuthGuard]:::cls
  N827 --> N828
  N829[AuthGuard()]:::mth
  N828 --> N829
  N830[canActivate()]:::mth
  N828 --> N830
  N831[handleRequest()]:::mth
  N828 --> N831
  N832[File: terminus.ts]:::file
  N688 --> N832
  N833[Class: HealthCheckService]:::cls
  N832 --> N833
  N834[HealthCheck()]:::mth
  N833 --> N834
  N835[function()]:::mth
  N833 --> N835
  N836[getStatus()]:::mth
  N833 --> N836
  N837[pingCheck()]:::mth
  N833 --> N837
  N838[Class: for]:::cls
  N832 --> N838
  N839[HealthCheck()]:::mth
  N838 --> N839
  N840[function()]:::mth
  N838 --> N840
  N841[getStatus()]:::mth
  N838 --> N841
  N842[pingCheck()]:::mth
  N838 --> N842
  N843[Class: HealthIndicator]:::cls
  N832 --> N843
  N844[HealthCheck()]:::mth
  N843 --> N844
  N845[function()]:::mth
  N843 --> N845
  N846[getStatus()]:::mth
  N843 --> N846
  N847[pingCheck()]:::mth
  N843 --> N847
  N848[Class: DrizzleHealthIndicator]:::cls
  N832 --> N848
  N849[HealthCheck()]:::mth
  N848 --> N849
  N850[function()]:::mth
  N848 --> N850
  N851[getStatus()]:::mth
  N848 --> N851
  N852[pingCheck()]:::mth
  N848 --> N852
  N853[Class: HealthCheckError]:::cls
  N832 --> N853
  N854[HealthCheck()]:::mth
  N853 --> N854
  N855[function()]:::mth
  N853 --> N855
  N856[getStatus()]:::mth
  N853 --> N856
  N857[pingCheck()]:::mth
  N853 --> N857
  N859[File: unified-ledger.controller.ts]:::file
  N688 --> N859
  N860[Class: UnifiedLedgerController]:::cls
  N859 --> N860
  N861[grid()]:::mth
  N860 --> N861
  N862[macro()]:::mth
  N860 --> N862
  N863[listGoals()]:::mth
  N860 --> N863
  N864[listPlans()]:::mth
  N860 --> N864
  N865[File: unified-ledger.module.ts]:::file
  N688 --> N865
  N866[Class: UnifiedLedgerModule]:::cls
  N865 --> N866
  N867[File: unified-ledger.service.ts]:::file
  N688 --> N867
  N868[Class: UnifiedLedgerService]:::cls
  N867 --> N868
  N869[onModuleInit()]:::mth
  N868 --> N869
  N870[initRelayConnection()]:::mth
  N868 --> N870
  N871[broadcast()]:::mth
  N868 --> N871
  N872[listRecords()]:::mth
  N868 --> N872
  N873[getRecord()]:::mth
  N868 --> N873
  N875[File: workflow.module.ts]:::file
  N688 --> N875
  N876[Class: WorkflowModule]:::cls
  N875 --> N876
  N877[File: agent.repository.ts]:::file
  N688 --> N877
  N878[Class: AgentRepository]:::cls
  N877 --> N878
  N879[create()]:::mth
  N878 --> N879
  N880[create()]:::mth
  N878 --> N880
  N881[findById()]:::mth
  N878 --> N881
  N882[findByUserId()]:::mth
  N878 --> N882
  N883[findAll()]:::mth
  N878 --> N883
  N884[File: api-logs.repository.ts]:::file
  N688 --> N884
  N885[Class: ApiLogsRepository]:::cls
  N884 --> N885
  N886[logRequest()]:::mth
  N885 --> N886
  N887[getRecentLogs()]:::mth
  N885 --> N887
  N888[getStats()]:::mth
  N885 --> N888
  N889[getStatusCodeDistribution()]:::mth
  N885 --> N889
  N890[getMethodDistribution()]:::mth
  N885 --> N890
  N891[File: audit-logs.repository.ts]:::file
  N688 --> N891
  N892[Class: AuditLogsRepository]:::cls
  N891 --> N892
  N893[create()]:::mth
  N892 --> N893
  N894[findById()]:::mth
  N892 --> N894
  N895[findAll()]:::mth
  N892 --> N895
  N896[count()]:::mth
  N892 --> N896
  N897[findByUserId()]:::mth
  N892 --> N897
  N898[File: configuration.repository.ts]:::file
  N688 --> N898
  N899[Class: ConfigurationRepository]:::cls
  N898 --> N899
  N900[findAllConfigs()]:::mth
  N899 --> N900
  N901[findConfigByKey()]:::mth
  N899 --> N901
  N902[updateConfig()]:::mth
  N899 --> N902
  N903[getSystemSettings()]:::mth
  N899 --> N903
  N904[updateSystemSettings()]:::mth
  N899 --> N904
  N906[File: workflow.repository.ts]:::file
  N688 --> N906
  N907[Class: WorkflowRepository]:::cls
  N906 --> N907
  N908[create()]:::mth
  N907 --> N908
  N909[create()]:::mth
  N907 --> N909
  N910[findById()]:::mth
  N907 --> N910
  N911[findByUserId()]:::mth
  N907 --> N911
  N912[findAll()]:::mth
  N907 --> N912
  N913[Class: WorkflowExecutionRepository]:::cls
  N906 --> N913
  N914[create()]:::mth
  N913 --> N914
  N915[create()]:::mth
  N913 --> N915
  N916[findById()]:::mth
  N913 --> N916
  N917[findByUserId()]:::mth
  N913 --> N917
  N918[findAll()]:::mth
  N913 --> N918
  N922[File: WorkflowBuilder.ts]:::file
  N688 --> N922
  N923[Class: for]:::cls
  N922 --> N923
  N924[addStep()]:::mth
  N923 --> N924
  N925[removeStep()]:::mth
  N923 --> N925
  N926[updateStep()]:::mth
  N923 --> N926
  N927[getStep()]:::mth
  N923 --> N927
  N928[addDependency()]:::mth
  N923 --> N928
  N929[Class: WorkflowBuilder]:::cls
  N922 --> N929
  N930[addStep()]:::mth
  N929 --> N930
  N931[removeStep()]:::mth
  N929 --> N931
  N932[updateStep()]:::mth
  N929 --> N932
  N933[getStep()]:::mth
  N929 --> N933
  N934[addDependency()]:::mth
  N929 --> N934
  N935[File: admin-audit-logs.service.ts]:::file
  N688 --> N935
  N936[Class: AdminAuditLogsService]:::cls
  N935 --> N936
  N937[getAuditLogs()]:::mth
  N936 --> N937
  N938[getAuditLogById()]:::mth
  N936 --> N938
  N939[getStatistics()]:::mth
  N936 --> N939
  N940[createAuditLog()]:::mth
  N936 --> N940
  N941[File: admin-configuration.service.ts]:::file
  N688 --> N941
  N942[Class: AdminConfigurationService]:::cls
  N941 --> N942
  N943[getAllConfigs()]:::mth
  N942 --> N943
  N944[updateConfig()]:::mth
  N942 --> N944
  N945[getSettings()]:::mth
  N942 --> N945
  N946[updateSettings()]:::mth
  N942 --> N946
  N947[File: agent-discovery-registry.service.ts]:::file
  N688 --> N947
  N948[Class: AgentDiscoveryRegistry]:::cls
  N947 --> N948
  N949[initializePubSub()]:::mth
  N948 --> N949
  N950[registerAgent()]:::mth
  N948 --> N950
  N951[indexCapabilities()]:::mth
  N948 --> N951
  N952[heartbeat()]:::mth
  N948 --> N952
  N953[deregisterAgent()]:::mth
  N948 --> N953
  N954[File: agent.service.ts]:::file
  N688 --> N954
  N955[Class: LocalAIDetectionService]:::cls
  N954 --> N955
  N956[detectAndCreateAgents()]:::mth
  N955 --> N956
  N957[getAvailableProviders()]:::mth
  N955 --> N957
  N958[handleError()]:::mth
  N955 --> N958
  N959[getAgents()]:::mth
  N955 --> N959
  N960[findAll()]:::mth
  N955 --> N960
  N961[Class: AgentService]:::cls
  N954 --> N961
  N962[detectAndCreateAgents()]:::mth
  N961 --> N962
  N963[getAvailableProviders()]:::mth
  N961 --> N963
  N964[handleError()]:::mth
  N961 --> N964
  N965[getAgents()]:::mth
  N961 --> N965
  N966[findAll()]:::mth
  N961 --> N966
  N967[File: api-core.service.ts]:::file
  N688 --> N967
  N968[Class: ApiCoreService]:::cls
  N967 --> N968
  N969[initialize()]:::mth
  N968 --> N969
  N970[healthCheck()]:::mth
  N968 --> N970
  N971[getVersion()]:::mth
  N968 --> N971
  N972[File: app-config.service.ts]:::file
  N688 --> N972
  N973[Class: AppConfigService]:::cls
  N972 --> N973
  N974[environment()]:::mth
  N973 --> N974
  N975[isProduction()]:::mth
  N973 --> N975
  N976[isDevelopment()]:::mth
  N973 --> N976
  N977[port()]:::mth
  N973 --> N977
  N978[jwt()]:::mth
  N973 --> N978
  N979[File: base.service.ts]:::file
  N688 --> N979
  N980[Class: BaseService]:::cls
  N979 --> N980
  N981[findAll()]:::mth
  N980 --> N981
  N982[findAll()]:::mth
  N980 --> N982
  N983[findById()]:::mth
  N980 --> N983
  N984[findOne()]:::mth
  N980 --> N984
  N985[create()]:::mth
  N980 --> N985
  N986[File: capability-matcher.service.ts]:::file
  N688 --> N986
  N987[Class: CapabilityMatcher]:::cls
  N986 --> N987
  N988[findCapabilityMatches()]:::mth
  N987 --> N988
  N989[calculateSemanticScore()]:::mth
  N987 --> N989
  N990[calculateTokenOverlap()]:::mth
  N987 --> N990
  N991[getMatchReasons()]:::mth
  N987 --> N991
  N992[checkDependencies()]:::mth
  N987 --> N992
  N993[File: database.service.ts]:::file
  N688 --> N993
  N994[Class: DatabaseService]:::cls
  N993 --> N994
  N995[client()]:::mth
  N994 --> N995
  N996[onModuleInit()]:::mth
  N994 --> N996
  N997[onModuleDestroy()]:::mth
  N994 --> N997
  N998[healthCheck()]:::mth
  N994 --> N998
  N999[enableShutdownHooks()]:::mth
  N994 --> N999
  N1000[Class: as]:::cls
  N993 --> N1000
  N1001[client()]:::mth
  N1000 --> N1001
  N1002[onModuleInit()]:::mth
  N1000 --> N1002
  N1003[onModuleDestroy()]:::mth
  N1000 --> N1003
  N1004[healthCheck()]:::mth
  N1000 --> N1004
  N1005[enableShutdownHooks()]:::mth
  N1000 --> N1005
  N1006[File: event.service.ts]:::file
  N688 --> N1006
  N1007[Class: EventService]:::cls
  N1006 --> N1007
  N1008[emit()]:::mth
  N1007 --> N1008
  N1009[File: health.service.ts]:::file
  N688 --> N1009
  N1010[Class: HealthCheckError]:::cls
  N1009 --> N1010
  N1011[isHealthy()]:::mth
  N1010 --> N1011
  N1012[Class: HealthService]:::cls
  N1009 --> N1012
  N1013[isHealthy()]:::mth
  N1012 --> N1013
  N1014[File: index.ts]:::file
  N688 --> N1014
  N1015[Class: BaseService]:::cls
  N1014 --> N1015
  N1016[formatError()]:::mth
  N1015 --> N1016
  N1017[getAgents()]:::mth
  N1015 --> N1017
  N1018[getAgentById()]:::mth
  N1015 --> N1018
  N1019[getWorkflows()]:::mth
  N1015 --> N1019
  N1020[getWorkflowExecutionById()]:::mth
  N1015 --> N1020
  N1021[Class: AgentService]:::cls
  N1014 --> N1021
  N1022[formatError()]:::mth
  N1021 --> N1022
  N1023[getAgents()]:::mth
  N1021 --> N1023
  N1024[getAgentById()]:::mth
  N1021 --> N1024
  N1025[getWorkflows()]:::mth
  N1021 --> N1025
  N1026[getWorkflowExecutionById()]:::mth
  N1021 --> N1026
  N1027[Class: WorkflowService]:::cls
  N1014 --> N1027
  N1028[formatError()]:::mth
  N1027 --> N1028
  N1029[getAgents()]:::mth
  N1027 --> N1029
  N1030[getAgentById()]:::mth
  N1027 --> N1030
  N1031[getWorkflows()]:::mth
  N1027 --> N1031
  N1032[getWorkflowExecutionById()]:::mth
  N1027 --> N1032
  N1033[File: redis.service.ts]:::file
  N688 --> N1033
  N1034[Class: RedisService]:::cls
  N1033 --> N1034
  N1035[onModuleDestroy()]:::mth
  N1034 --> N1035
  N1036[get()]:::mth
  N1034 --> N1036
  N1037[getAll()]:::mth
  N1034 --> N1037
  N1038[set()]:::mth
  N1034 --> N1038
  N1039[setWorkflowState()]:::mth
  N1034 --> N1039
  N1040[File: system-metrics.service.ts]:::file
  N688 --> N1040
  N1041[Class: SystemMetricsService]:::cls
  N1040 --> N1041
  N1042[getMetrics()]:::mth
  N1041 --> N1042
  N1043[getCpuUsage()]:::mth
  N1041 --> N1043
  N1044[getMemoryUsage()]:::mth
  N1041 --> N1044
  N1045[getDatabaseMetrics()]:::mth
  N1041 --> N1045
  N1046[count()]:::mth
  N1041 --> N1046
  N1047[File: workflow.service.ts]:::file
  N688 --> N1047
  N1048[Class: WorkflowService]:::cls
  N1047 --> N1048
  N1049[handleError()]:::mth
  N1048 --> N1049
  N1050[createWorkflow()]:::mth
  N1048 --> N1050
  N1051[getWorkflows()]:::mth
  N1048 --> N1051
  N1052[getWorkflowById()]:::mth
  N1048 --> N1052
  N1053[updateWorkflow()]:::mth
  N1048 --> N1053
  N1066[File: logger.ts]:::file
  N688 --> N1066
  N1067[Class: Logger]:::cls
  N1066 --> N1067
  N1068[info()]:::mth
  N1067 --> N1068
  N1069[debug()]:::mth
  N1067 --> N1069
  N1070[warn()]:::mth
  N1067 --> N1070
  N1071[error()]:::mth
  N1067 --> N1071
  N1072[timestamp()]:::mth
  N1067 --> N1072
  N1075[api-client]:::pkg
  TNF --> N1075
  N1076[File: ENHANCEMENT_COMPLETION_SUMMARY.ts]:::file
  N1075 --> N1076
  N1077[Class: and]:::cls
  N1076 --> N1077
  N1078[demonstrateEnhancedApiClient()]:::mth
  N1077 --> N1078
  N1079[getProjects()]:::mth
  N1077 --> N1079
  N1080[getProject()]:::mth
  N1077 --> N1080
  N1081[createProject()]:::mth
  N1077 --> N1081
  N1082[updateProject()]:::mth
  N1077 --> N1082
  N1083[Class: ProjectService]:::cls
  N1076 --> N1083
  N1084[demonstrateEnhancedApiClient()]:::mth
  N1083 --> N1084
  N1085[getProjects()]:::mth
  N1083 --> N1085
  N1086[getProject()]:::mth
  N1083 --> N1086
  N1087[createProject()]:::mth
  N1083 --> N1087
  N1088[updateProject()]:::mth
  N1083 --> N1088
  N1089[Class: has]:::cls
  N1076 --> N1089
  N1090[demonstrateEnhancedApiClient()]:::mth
  N1089 --> N1090
  N1091[getProjects()]:::mth
  N1089 --> N1091
  N1092[getProject()]:::mth
  N1089 --> N1092
  N1093[createProject()]:::mth
  N1089 --> N1093
  N1094[updateProject()]:::mth
  N1089 --> N1094
  N1096[File: enhanced-base-service-example.ts]:::file
  N1075 --> N1096
  N1097[Class: ProductService]:::cls
  N1096 --> N1097
  N1098[getProducts()]:::mth
  N1097 --> N1098
  N1099[getProduct()]:::mth
  N1097 --> N1099
  N1100[createProduct()]:::mth
  N1097 --> N1100
  N1101[updateProduct()]:::mth
  N1097 --> N1101
  N1102[deleteProduct()]:::mth
  N1097 --> N1102
  N1103[Class: OrderService]:::cls
  N1096 --> N1103
  N1104[getProducts()]:::mth
  N1103 --> N1104
  N1105[getProduct()]:::mth
  N1103 --> N1105
  N1106[createProduct()]:::mth
  N1103 --> N1106
  N1107[updateProduct()]:::mth
  N1103 --> N1107
  N1108[deleteProduct()]:::mth
  N1103 --> N1108
  N1109[File: agents.client.ts]:::file
  N1075 --> N1109
  N1110[Class: AgentsClient]:::cls
  N1109 --> N1110
  N1111[createAgent()]:::mth
  N1110 --> N1111
  N1112[getAgents()]:::mth
  N1110 --> N1112
  N1113[getAgent()]:::mth
  N1110 --> N1113
  N1114[updateAgent()]:::mth
  N1110 --> N1114
  N1115[deleteAgent()]:::mth
  N1110 --> N1115
  N1116[File: api-client.ts]:::file
  N1075 --> N1116
  N1117[Class: ApiClient]:::cls
  N1116 --> N1117
  N1118[setupInterceptors()]:::mth
  N1117 --> N1118
  N1119[handleError()]:::mth
  N1117 --> N1119
  N1120[setToken()]:::mth
  N1117 --> N1120
  N1121[clearToken()]:::mth
  N1117 --> N1121
  N1122[createApiClient()]:::mth
  N1117 --> N1122
  N1123[File: AuthService.ts]:::file
  N1075 --> N1123
  N1124[Class: AuthService]:::cls
  N1123 --> N1124
  N1125[login()]:::mth
  N1124 --> N1125
  N1126[register()]:::mth
  N1124 --> N1126
  N1127[logout()]:::mth
  N1124 --> N1127
  N1128[refreshToken()]:::mth
  N1124 --> N1128
  N1129[getCurrentUser()]:::mth
  N1124 --> N1129
  N1131[File: ApiClient.ts]:::file
  N1075 --> N1131
  N1132[Class: ApiClient]:::cls
  N1131 --> N1132
  N1133[setupInterceptors()]:::mth
  N1132 --> N1133
  N1134[refreshToken()]:::mth
  N1132 --> N1134
  N1135[sanitizeErrorMessage()]:::mth
  N1132 --> N1135
  N1136[formatError()]:::mth
  N1132 --> N1136
  N1138[File: ApiClient.ts]:::file
  N1075 --> N1138
  N1139[Class: ApiClient]:::cls
  N1138 --> N1139
  N1140[getAuthToken()]:::mth
  N1139 --> N1140
  N1141[getAxiosInstance()]:::mth
  N1139 --> N1141
  N1143[File: BaseIntegration.ts]:::file
  N1075 --> N1143
  N1144[Class: that]:::cls
  N1143 --> N1144
  N1145[connect()]:::mth
  N1144 --> N1145
  N1146[Class: BaseIntegration]:::cls
  N1143 --> N1146
  N1147[connect()]:::mth
  N1146 --> N1147
  N1148[File: IntegrationRegistry.ts]:::file
  N1075 --> N1148
  N1149[Class: IntegrationRegistryImpl]:::cls
  N1148 --> N1149
  N1150[registerIntegration()]:::mth
  N1149 --> N1150
  N1151[getIntegration()]:::mth
  N1149 --> N1151
  N1152[hasIntegration()]:::mth
  N1149 --> N1152
  N1153[getIntegrations()]:::mth
  N1149 --> N1153
  N1154[getIntegrationsByType()]:::mth
  N1149 --> N1154
  N1155[Class: LoggingService]:::cls
  N1148 --> N1155
  N1156[registerIntegration()]:::mth
  N1155 --> N1156
  N1157[getIntegration()]:::mth
  N1155 --> N1157
  N1158[hasIntegration()]:::mth
  N1155 --> N1158
  N1159[getIntegrations()]:::mth
  N1155 --> N1159
  N1160[getIntegrationsByType()]:::mth
  N1155 --> N1160
  N1161[File: anthropic.ts]:::file
  N1075 --> N1161
  N1162[Class: AnthropicIntegration]:::cls
  N1161 --> N1162
  N1163[connect()]:::mth
  N1162 --> N1163
  N1164[disconnect()]:::mth
  N1162 --> N1164
  N1165[execute()]:::mth
  N1162 --> N1165
  N1166[createChatCompletion()]:::mth
  N1162 --> N1166
  N1167[listKnownModels()]:::mth
  N1162 --> N1167
  N1168[File: huggingface.ts]:::file
  N1075 --> N1168
  N1169[Class: HuggingFaceIntegration]:::cls
  N1168 --> N1169
  N1170[connect()]:::mth
  N1169 --> N1170
  N1171[disconnect()]:::mth
  N1169 --> N1171
  N1172[execute()]:::mth
  N1169 --> N1172
  N1173[runInference()]:::mth
  N1169 --> N1173
  N1174[getMetadata()]:::mth
  N1169 --> N1174
  N1176[File: openai.ts]:::file
  N1075 --> N1176
  N1177[Class: OpenAIIntegration]:::cls
  N1176 --> N1177
  N1178[connect()]:::mth
  N1177 --> N1178
  N1179[disconnect()]:::mth
  N1177 --> N1179
  N1180[execute()]:::mth
  N1177 --> N1180
  N1181[createChatCompletion()]:::mth
  N1177 --> N1181
  N1182[createCompletion()]:::mth
  N1177 --> N1182
  N1183[File: stability-ai.ts]:::file
  N1075 --> N1183
  N1184[Class: StabilityAIIntegration]:::cls
  N1183 --> N1184
  N1185[connect()]:::mth
  N1184 --> N1185
  N1186[disconnect()]:::mth
  N1184 --> N1186
  N1187[execute()]:::mth
  N1184 --> N1187
  N1188[textToImage()]:::mth
  N1184 --> N1188
  N1189[imageToImage()]:::mth
  N1184 --> N1189
  N1190[File: stability.ts]:::file
  N1075 --> N1190
  N1191[Class: StabilityAIIntegration]:::cls
  N1190 --> N1191
  N1192[connect()]:::mth
  N1191 --> N1192
  N1193[disconnect()]:::mth
  N1191 --> N1193
  N1194[execute()]:::mth
  N1191 --> N1194
  N1195[listEngines()]:::mth
  N1191 --> N1195
  N1196[generateImageFromText()]:::mth
  N1191 --> N1196
  N1198[File: make.ts]:::file
  N1075 --> N1198
  N1199[Class: MakeIntegration]:::cls
  N1198 --> N1199
  N1200[connect()]:::mth
  N1199 --> N1200
  N1201[disconnect()]:::mth
  N1199 --> N1201
  N1202[execute()]:::mth
  N1199 --> N1202
  N1203[listScenarios()]:::mth
  N1199 --> N1203
  N1204[getScenario()]:::mth
  N1199 --> N1204
  N1205[File: pabbly.ts]:::file
  N1075 --> N1205
  N1206[Class: PabblyIntegration]:::cls
  N1205 --> N1206
  N1207[connect()]:::mth
  N1206 --> N1207
  N1208[disconnect()]:::mth
  N1206 --> N1208
  N1209[execute()]:::mth
  N1206 --> N1209
  N1210[listWorkflows()]:::mth
  N1206 --> N1210
  N1211[executeWorkflow()]:::mth
  N1206 --> N1211
  N1212[File: zapier.ts]:::file
  N1075 --> N1212
  N1213[Class: ZapierIntegration]:::cls
  N1212 --> N1213
  N1214[connect()]:::mth
  N1213 --> N1214
  N1215[disconnect()]:::mth
  N1213 --> N1215
  N1216[execute()]:::mth
  N1213 --> N1216
  N1217[listZaps()]:::mth
  N1213 --> N1217
  N1218[getZap()]:::mth
  N1213 --> N1218
  N1220[File: shopify.ts]:::file
  N1075 --> N1220
  N1221[Class: ShopifyIntegration]:::cls
  N1220 --> N1221
  N1222[connect()]:::mth
  N1221 --> N1222
  N1223[disconnect()]:::mth
  N1221 --> N1223
  N1224[execute()]:::mth
  N1221 --> N1224
  N1225[createProduct()]:::mth
  N1221 --> N1225
  N1226[updateProduct()]:::mth
  N1221 --> N1226
  N1228[File: make.ts]:::file
  N1075 --> N1228
  N1229[Class: MakeIntegration]:::cls
  N1228 --> N1229
  N1230[connect()]:::mth
  N1229 --> N1230
  N1231[disconnect()]:::mth
  N1229 --> N1231
  N1232[execute()]:::mth
  N1229 --> N1232
  N1233[listScenarios()]:::mth
  N1229 --> N1233
  N1234[getScenario()]:::mth
  N1229 --> N1234
  N1235[File: n8n.ts]:::file
  N1075 --> N1235
  N1236[Class: N8nIntegration]:::cls
  N1235 --> N1236
  N1237[connect()]:::mth
  N1236 --> N1237
  N1238[disconnect()]:::mth
  N1236 --> N1238
  N1239[execute()]:::mth
  N1236 --> N1239
  N1240[listWorkflows()]:::mth
  N1236 --> N1240
  N1241[getWorkflow()]:::mth
  N1236 --> N1241
  N1242[File: registry.ts]:::file
  N1075 --> N1242
  N1243[Class: IntegrationRegistry]:::cls
  N1242 --> N1243
  N1244[registerIntegration()]:::mth
  N1243 --> N1244
  N1245[getIntegration()]:::mth
  N1243 --> N1245
  N1246[getAllIntegrations()]:::mth
  N1243 --> N1246
  N1247[getIntegrationsByType()]:::mth
  N1243 --> N1247
  N1248[hasIntegration()]:::mth
  N1243 --> N1248
  N1250[File: linkedin.ts]:::file
  N1075 --> N1250
  N1251[Class: LinkedInIntegration]:::cls
  N1250 --> N1251
  N1252[connect()]:::mth
  N1251 --> N1252
  N1253[disconnect()]:::mth
  N1251 --> N1253
  N1254[execute()]:::mth
  N1251 --> N1254
  N1255[createPost()]:::mth
  N1251 --> N1255
  N1256[shareUpdate()]:::mth
  N1251 --> N1256
  N1257[File: twitter.ts]:::file
  N1075 --> N1257
  N1258[Class: TwitterIntegration]:::cls
  N1257 --> N1258
  N1259[connect()]:::mth
  N1258 --> N1259
  N1260[disconnect()]:::mth
  N1258 --> N1260
  N1261[execute()]:::mth
  N1258 --> N1261
  N1262[postTweet()]:::mth
  N1258 --> N1262
  N1263[deleteTweet()]:::mth
  N1258 --> N1263
  N1265[File: zapier.ts]:::file
  N1075 --> N1265
  N1266[Class: ZapierIntegration]:::cls
  N1265 --> N1266
  N1267[connect()]:::mth
  N1266 --> N1267
  N1268[disconnect()]:::mth
  N1266 --> N1268
  N1269[execute()]:::mth
  N1266 --> N1269
  N1270[listApps()]:::mth
  N1266 --> N1270
  N1271[listZaps()]:::mth
  N1266 --> N1271
  N1272[File: MarketplaceService.ts]:::file
  N1075 --> N1272
  N1273[Class: MarketplaceService]:::cls
  N1272 --> N1273
  N1274[initialize()]:::mth
  N1273 --> N1274
  N1275[discoverIntegrations()]:::mth
  N1273 --> N1275
  N1276[installIntegration()]:::mth
  N1273 --> N1276
  N1277[uninstallIntegration()]:::mth
  N1273 --> N1277
  N1278[getListings()]:::mth
  N1273 --> N1278
  N1279[Class: LoggingService]:::cls
  N1272 --> N1279
  N1280[initialize()]:::mth
  N1279 --> N1280
  N1281[discoverIntegrations()]:::mth
  N1279 --> N1281
  N1282[installIntegration()]:::mth
  N1279 --> N1282
  N1283[uninstallIntegration()]:::mth
  N1279 --> N1283
  N1284[getListings()]:::mth
  N1279 --> N1284
  N1285[File: AgentService.ts]:::file
  N1075 --> N1285
  N1286[Class: AgentService]:::cls
  N1285 --> N1286
  N1287[getAgents()]:::mth
  N1286 --> N1287
  N1288[getAgent()]:::mth
  N1286 --> N1288
  N1289[createAgent()]:::mth
  N1286 --> N1289
  N1290[updateAgent()]:::mth
  N1286 --> N1290
  N1291[deleteAgent()]:::mth
  N1286 --> N1291
  N1292[File: BaseService.ts]:::file
  N1075 --> N1292
  N1293[Class: for]:::cls
  N1292 --> N1293
  N1294[getPath()]:::mth
  N1293 --> N1294
  N1295[validateRequired()]:::mth
  N1293 --> N1295
  N1296[buildQueryString()]:::mth
  N1293 --> N1296
  N1297[Class: BaseService]:::cls
  N1292 --> N1297
  N1298[getPath()]:::mth
  N1297 --> N1298
  N1299[validateRequired()]:::mth
  N1297 --> N1299
  N1300[buildQueryString()]:::mth
  N1297 --> N1300
  N1301[File: UserService.ts]:::file
  N1075 --> N1301
  N1302[Class: UserService]:::cls
  N1301 --> N1302
  N1303[getUser()]:::mth
  N1302 --> N1303
  N1304[getCurrentUser()]:::mth
  N1302 --> N1304
  N1305[updateCurrentUser()]:::mth
  N1302 --> N1305
  N1306[changePassword()]:::mth
  N1302 --> N1306
  N1307[getUsers()]:::mth
  N1302 --> N1307
  N1308[File: WorkflowService.ts]:::file
  N1075 --> N1308
  N1309[Class: WorkflowService]:::cls
  N1308 --> N1309
  N1310[getWorkflows()]:::mth
  N1309 --> N1310
  N1311[getWorkflow()]:::mth
  N1309 --> N1311
  N1312[createWorkflow()]:::mth
  N1309 --> N1312
  N1313[updateWorkflow()]:::mth
  N1309 --> N1313
  N1314[deleteWorkflow()]:::mth
  N1309 --> N1314
  N1315[File: agent.service.ts]:::file
  N1075 --> N1315
  N1316[Class: AgentService]:::cls
  N1315 --> N1316
  N1317[getAgents()]:::mth
  N1316 --> N1317
  N1318[getAgentById()]:::mth
  N1316 --> N1318
  N1319[createAgent()]:::mth
  N1316 --> N1319
  N1320[updateAgent()]:::mth
  N1316 --> N1320
  N1321[deleteAgent()]:::mth
  N1316 --> N1321
  N1322[File: auth.service.ts]:::file
  N1075 --> N1322
  N1323[Class: AuthService]:::cls
  N1322 --> N1323
  N1324[login()]:::mth
  N1323 --> N1324
  N1325[register()]:::mth
  N1323 --> N1325
  N1326[logout()]:::mth
  N1323 --> N1326
  N1327[forgotPassword()]:::mth
  N1323 --> N1327
  N1328[resetPassword()]:::mth
  N1323 --> N1328
  N1330[File: user.service.ts]:::file
  N1075 --> N1330
  N1331[Class: UserService]:::cls
  N1330 --> N1331
  N1332[getUsers()]:::mth
  N1331 --> N1332
  N1333[getUserById()]:::mth
  N1331 --> N1333
  N1334[updateUser()]:::mth
  N1331 --> N1334
  N1335[deleteUser()]:::mth
  N1331 --> N1335
  N1336[updateProfile()]:::mth
  N1331 --> N1336
  N1337[File: workflow.service.ts]:::file
  N1075 --> N1337
  N1338[Class: WorkflowService]:::cls
  N1337 --> N1338
  N1339[getWorkflows()]:::mth
  N1338 --> N1339
  N1340[getWorkflowById()]:::mth
  N1338 --> N1340
  N1341[createWorkflow()]:::mth
  N1338 --> N1341
  N1342[updateWorkflow()]:::mth
  N1338 --> N1342
  N1343[deleteWorkflow()]:::mth
  N1338 --> N1343
  N1344[api-gateway]:::pkg
  TNF --> N1344
  N1345[File: agents.controller.ts]:::file
  N1344 --> N1345
  N1346[Class: AgentsController]:::cls
  N1345 --> N1346
  N1347[getAgents()]:::mth
  N1346 --> N1347
  N1348[File: agents.module.ts]:::file
  N1344 --> N1348
  N1349[Class: AgentsModule]:::cls
  N1348 --> N1349
  N1350[File: agents.service.ts]:::file
  N1344 --> N1350
  N1351[Class: AgentsService]:::cls
  N1350 --> N1351
  N1352[getAgents()]:::mth
  N1351 --> N1352
  N1353[getAgent()]:::mth
  N1351 --> N1353
  N1354[File: app.module.ts]:::file
  N1344 --> N1354
  N1355[Class: AppModule]:::cls
  N1354 --> N1355
  N1356[File: auth.module.ts]:::file
  N1344 --> N1356
  N1357[Class: AuthModule]:::cls
  N1356 --> N1357
  N1358[File: auth.service.ts]:::file
  N1344 --> N1358
  N1359[Class: AuthService]:::cls
  N1358 --> N1359
  N1360[validateUser()]:::mth
  N1359 --> N1360
  N1361[login()]:::mth
  N1359 --> N1361
  N1362[validateTokenPayload()]:::mth
  N1359 --> N1362
  N1363[refreshToken()]:::mth
  N1359 --> N1363
  N1364[logout()]:::mth
  N1359 --> N1364
  N1365[File: jwt-auth.guard.ts]:::file
  N1344 --> N1365
  N1366[Class: JwtAuthGuard]:::cls
  N1365 --> N1366
  N1367[AuthGuard()]:::mth
  N1366 --> N1367
  N1368[File: jwt.strategy.ts]:::file
  N1344 --> N1368
  N1369[Class: JwtStrategy]:::cls
  N1368 --> N1369
  N1370[PassportStrategy()]:::mth
  N1369 --> N1370
  N1371[validate()]:::mth
  N1369 --> N1371
  N1372[File: agent-orchestration.controller.ts]:::file
  N1344 --> N1372
  N1373[Class: AgentOrchestrationController]:::cls
  N1372 --> N1373
  N1374[getOrchestrationStatus()]:::mth
  N1373 --> N1374
  N1375[api-optimization]:::pkg
  TNF --> N1375
  N1376[File: api-optimization.module.ts]:::file
  N1375 --> N1376
  N1377[Class: ApiOptimizationModule]:::cls
  N1376 --> N1377
  N1378[File: backpressure.middleware.ts]:::file
  N1375 --> N1378
  N1379[Class: BackpressureMiddleware]:::cls
  N1378 --> N1379
  N1380[initializeConfig()]:::mth
  N1379 --> N1380
  N1381[use()]:::mth
  N1379 --> N1381
  N1382[startQueueProcessor()]:::mth
  N1379 --> N1382
  N1383[processQueue()]:::mth
  N1379 --> N1383
  N1384[shouldSkip()]:::mth
  N1379 --> N1384
  N1386[File: cache-invalidation.service.ts]:::file
  N1375 --> N1386
  N1387[Class: CacheInvalidationService]:::cls
  N1386 --> N1387
  N1388[invalidate()]:::mth
  N1387 --> N1388
  N1389[scheduleInvalidation()]:::mth
  N1387 --> N1389
  N1390[cancelScheduledInvalidation()]:::mth
  N1387 --> N1390
  N1391[invalidateOnEvent()]:::mth
  N1387 --> N1391
  N1392[getStats()]:::mth
  N1387 --> N1392
  N1394[File: cache.interceptor.ts]:::file
  N1375 --> N1394
  N1395[Class: CacheInterceptor]:::cls
  N1394 --> N1395
  N1396[getUsers()]:::mth
  N1395 --> N1396
  N1397[intercept()]:::mth
  N1395 --> N1397
  N1398[getCacheKey()]:::mth
  N1395 --> N1398
  N1399[setCacheHeaders()]:::mth
  N1395 --> N1399
  N1400[hashKey()]:::mth
  N1395 --> N1400
  N1401[File: cache.module.ts]:::file
  N1375 --> N1401
  N1402[Class: CacheModule]:::cls
  N1401 --> N1402
  N1404[File: response-cache.service.ts]:::file
  N1375 --> N1404
  N1405[Class: ResponseCacheService]:::cls
  N1404 --> N1405
  N1406[initializeMemoryCache()]:::mth
  N1405 --> N1406
  N1407[delete()]:::mth
  N1405 --> N1407
  N1408[invalidateByTag()]:::mth
  N1405 --> N1408
  N1409[invalidateByPattern()]:::mth
  N1405 --> N1409
  N1410[getStats()]:::mth
  N1405 --> N1410
  N1411[File: cache-headers.middleware.ts]:::file
  N1375 --> N1411
  N1412[Class: CacheHeadersMiddleware]:::cls
  N1411 --> N1412
  N1413[initializeConfig()]:::mth
  N1412 --> N1413
  N1414[use()]:::mth
  N1412 --> N1414
  N1415[isStaticAsset()]:::mth
  N1412 --> N1415
  N1416[shouldCache()]:::mth
  N1412 --> N1416
  N1417[setStaticAssetHeaders()]:::mth
  N1412 --> N1417
  N1418[File: cdn-config.service.ts]:::file
  N1375 --> N1418
  N1419[Class: CDNConfigService]:::cls
  N1418 --> N1419
  N1420[initializeConfig()]:::mth
  N1419 --> N1420
  N1421[getCDNUrl()]:::mth
  N1419 --> N1421
  N1422[purgeUrls()]:::mth
  N1419 --> N1422
  N1423[purgeAll()]:::mth
  N1419 --> N1423
  N1424[purgeCloudflare()]:::mth
  N1419 --> N1424
  N1428[File: optimization-monitoring.service.ts]:::file
  N1375 --> N1428
  N1429[Class: OptimizationMonitoringService]:::cls
  N1428 --> N1429
  N1430[getMetrics()]:::mth
  N1429 --> N1430
  N1431[getAlerts()]:::mth
  N1429 --> N1431
  N1432[getAlertsBySeverity()]:::mth
  N1429 --> N1432
  N1433[clearAlerts()]:::mth
  N1429 --> N1433
  N1434[getHealthStatus()]:::mth
  N1429 --> N1434
  N1436[File: quota-management.service.ts]:::file
  N1375 --> N1436
  N1437[Class: QuotaManagementService]:::cls
  N1436 --> N1437
  N1438[consumeQuota()]:::mth
  N1437 --> N1438
  N1439[getUsage()]:::mth
  N1437 --> N1439
  N1440[getUserQuotas()]:::mth
  N1437 --> N1440
  N1441[resetQuota()]:::mth
  N1437 --> N1441
  N1442[addTier()]:::mth
  N1437 --> N1442
  N1445[File: rate-limit.guard.ts]:::file
  N1375 --> N1445
  N1446[Class: RateLimitGuard]:::cls
  N1445 --> N1446
  N1447[myEndpoint()]:::mth
  N1446 --> N1447
  N1448[canActivate()]:::mth
  N1446 --> N1448
  N1449[getRateLimitKey()]:::mth
  N1446 --> N1449
  N1450[setRateLimitHeaders()]:::mth
  N1446 --> N1450
  N1451[File: rate-limit.middleware.ts]:::file
  N1375 --> N1451
  N1452[Class: RateLimitMiddleware]:::cls
  N1451 --> N1452
  N1453[use()]:::mth
  N1452 --> N1453
  N1454[shouldSkip()]:::mth
  N1452 --> N1454
  N1455[getRateLimitKey()]:::mth
  N1452 --> N1455
  N1456[File: rate-limit.module.ts]:::file
  N1375 --> N1456
  N1457[Class: RateLimitModule]:::cls
  N1456 --> N1457
  N1458[File: redis-rate-limiter.service.ts]:::file
  N1375 --> N1458
  N1459[Class: RedisRateLimiterService]:::cls
  N1458 --> N1459
  N1460[consume()]:::mth
  N1459 --> N1460
  N1461[isBlocked()]:::mth
  N1459 --> N1461
  N1462[getTierConfig()]:::mth
  N1459 --> N1462
  N1463[addTier()]:::mth
  N1459 --> N1463
  N1464[getRemaining()]:::mth
  N1459 --> N1464
  N1465[File: cache-warming.service.ts]:::file
  N1375 --> N1465
  N1466[Class: CacheWarmingService]:::cls
  N1465 --> N1466
  N1467[onModuleInit()]:::mth
  N1466 --> N1467
  N1468[initializeStrategies()]:::mth
  N1466 --> N1468
  N1469[warmAll()]:::mth
  N1466 --> N1469
  N1470[warmStrategy()]:::mth
  N1466 --> N1470
  N1471[warmUrls()]:::mth
  N1466 --> N1471
  N1473[api-types]:::pkg
  TNF --> N1473
  N1475[File: api-response.ts]:::file
  N1473 --> N1475
  N1476[Class: ApiResponseBuilder]:::cls
  N1475 --> N1476
  N1477[data()]:::mth
  N1476 --> N1477
  N1478[message()]:::mth
  N1476 --> N1478
  N1479[requestId()]:::mth
  N1476 --> N1479
  N1480[version()]:::mth
  N1476 --> N1480
  N1481[build()]:::mth
  N1476 --> N1481
  N1483[File: common.ts]:::file
  N1473 --> N1483
  N1484[Class: HealthCheckError]:::cls
  N1483 --> N1484
  N1494[auth]:::pkg
  TNF --> N1494
  N1496[File: AgentAuthService.ts]:::file
  N1494 --> N1496
  N1497[Class: AgentAuthService]:::cls
  N1496 --> N1497
  N1498[generateToken()]:::mth
  N1497 --> N1498
  N1499[verifyToken()]:::mth
  N1497 --> N1499
  N1500[hasCapability()]:::mth
  N1497 --> N1500
  N1501[backend]:::pkg
  TNF --> N1501
  N1504[build-optimization]:::pkg
  TNF --> N1504
  N1506[File: BuildProcessThrottler.ts]:::file
  N1504 --> N1506
  N1507[Class: BuildProcessThrottler]:::cls
  N1506 --> N1507
  N1508[addTask()]:::mth
  N1507 --> N1508
  N1509[getTaskResult()]:::mth
  N1507 --> N1509
  N1510[waitForTask()]:::mth
  N1507 --> N1510
  N1511[cancelTask()]:::mth
  N1507 --> N1511
  N1512[setMaxConcurrency()]:::mth
  N1507 --> N1512
  N1514[File: ConcurrencyController.ts]:::file
  N1504 --> N1514
  N1515[Class: ConcurrencyController]:::cls
  N1514 --> N1515
  N1516[getCurrentConcurrency()]:::mth
  N1515 --> N1516
  N1517[setMaxConcurrency()]:::mth
  N1515 --> N1517
  N1518[adjustConcurrency()]:::mth
  N1515 --> N1518
  N1519[calculateOptimalConcurrency()]:::mth
  N1515 --> N1519
  N1520[resetConcurrency()]:::mth
  N1515 --> N1520
  N1523[File: BuildStageOptimizer.ts]:::file
  N1504 --> N1523
  N1524[Class: BuildStageOptimizer]:::cls
  N1523 --> N1524
  N1525[optimizeBuildStages()]:::mth
  N1524 --> N1525
  N1526[estimateStageMemoryUsage()]:::mth
  N1524 --> N1526
  N1527[optimizeStageMemoryUsage()]:::mth
  N1524 --> N1527
  N1528[calculateOptimizationMetrics()]:::mth
  N1524 --> N1528
  N1529[detectCircularDependencies()]:::mth
  N1524 --> N1529
  N1531[File: DependencyGraphAnalyzer.ts]:::file
  N1504 --> N1531
  N1532[Class: analyzes]:::cls
  N1531 --> N1532
  N1533[analyzeDependencies()]:::mth
  N1532 --> N1533
  N1534[createBuildStages()]:::mth
  N1532 --> N1534
  N1535[getOptimalBuildOrder()]:::mth
  N1532 --> N1535
  N1536[detectCircularDependencies()]:::mth
  N1532 --> N1536
  N1537[findPackageJsonFiles()]:::mth
  N1532 --> N1537
  N1538[Class: DependencyGraphAnalyzer]:::cls
  N1531 --> N1538
  N1539[analyzeDependencies()]:::mth
  N1538 --> N1539
  N1540[createBuildStages()]:::mth
  N1538 --> N1540
  N1541[getOptimalBuildOrder()]:::mth
  N1538 --> N1541
  N1542[detectCircularDependencies()]:::mth
  N1538 --> N1542
  N1543[findPackageJsonFiles()]:::mth
  N1538 --> N1543
  N1548[File: BuildFailureAnalyzer.ts]:::file
  N1504 --> N1548
  N1549[Class: BuildFailureAnalyzer]:::cls
  N1548 --> N1549
  N1550[analyzeBuildFailure()]:::mth
  N1549 --> N1550
  N1551[analyzeMemoryIssues()]:::mth
  N1549 --> N1551
  N1552[generateSystemRecommendations()]:::mth
  N1549 --> N1552
  N1553[getAnalysisHistory()]:::mth
  N1549 --> N1553
  N1554[clearHistory()]:::mth
  N1549 --> N1554
  N1556[File: BuildMetricsCollector.ts]:::file
  N1504 --> N1556
  N1557[Class: BuildMetricsCollector]:::cls
  N1556 --> N1557
  N1558[start()]:::mth
  N1557 --> N1558
  N1559[stop()]:::mth
  N1557 --> N1559
  N1560[startCollection()]:::mth
  N1557 --> N1560
  N1561[stopCollection()]:::mth
  N1557 --> N1561
  N1562[recordEvent()]:::mth
  N1557 --> N1562
  N1563[Class: abstract]:::cls
  N1556 --> N1563
  N1564[start()]:::mth
  N1563 --> N1564
  N1565[stop()]:::mth
  N1563 --> N1565
  N1566[startCollection()]:::mth
  N1563 --> N1566
  N1567[stopCollection()]:::mth
  N1563 --> N1567
  N1568[recordEvent()]:::mth
  N1563 --> N1568
  N1569[Class: abstract]:::cls
  N1556 --> N1569
  N1570[start()]:::mth
  N1569 --> N1570
  N1571[stop()]:::mth
  N1569 --> N1571
  N1572[startCollection()]:::mth
  N1569 --> N1572
  N1573[stopCollection()]:::mth
  N1569 --> N1573
  N1574[recordEvent()]:::mth
  N1569 --> N1574
  N1575[File: BuildMonitoringSystem.ts]:::file
  N1504 --> N1575
  N1576[Class: BuildMonitoringSystem]:::cls
  N1575 --> N1576
  N1577[createMetricsCollector()]:::mth
  N1576 --> N1577
  N1578[formatPrometheusMetrics()]:::mth
  N1576 --> N1578
  N1579[getBuildStatus()]:::mth
  N1576 --> N1579
  N1580[startBuildMonitoring()]:::mth
  N1576 --> N1580
  N1581[stopBuildMonitoring()]:::mth
  N1576 --> N1581
  N1582[File: BuildUnifiedErrorHandler.ts]:::file
  N1504 --> N1582
  N1583[Class: BuildUnifiedErrorHandler]:::cls
  N1582 --> N1583
  N1584[initializeDefaultRecoveryStrategies()]:::mth
  N1583 --> N1584
  N1585[initializeDefaultErrorHandlers()]:::mth
  N1583 --> N1585
  N1586[createBuildError()]:::mth
  N1583 --> N1586
  N1587[handleMemoryError()]:::mth
  N1583 --> N1587
  N1588[handleCompilationError()]:::mth
  N1583 --> N1588
  N1590[File: BuildOrchestrator.test.ts]:::file
  N1504 --> N1590
  N1591[Class: MockSystemResourceDetector]:::cls
  N1590 --> N1591
  N1592[getSystemResources()]:::mth
  N1591 --> N1592
  N1593[getCurrentMemoryUsage()]:::mth
  N1591 --> N1593
  N1594[hasSufficientResources()]:::mth
  N1591 --> N1594
  N1595[startMonitoring()]:::mth
  N1591 --> N1595
  N1596[stopMonitoring()]:::mth
  N1591 --> N1596
  N1597[Class: MockMemoryMonitor]:::cls
  N1590 --> N1597
  N1598[getSystemResources()]:::mth
  N1597 --> N1598
  N1599[getCurrentMemoryUsage()]:::mth
  N1597 --> N1599
  N1600[hasSufficientResources()]:::mth
  N1597 --> N1600
  N1601[startMonitoring()]:::mth
  N1597 --> N1601
  N1602[stopMonitoring()]:::mth
  N1597 --> N1602
  N1603[Class: MockDependencyGraphAnalyzer]:::cls
  N1590 --> N1603
  N1604[getSystemResources()]:::mth
  N1603 --> N1604
  N1605[getCurrentMemoryUsage()]:::mth
  N1603 --> N1605
  N1606[hasSufficientResources()]:::mth
  N1603 --> N1606
  N1607[startMonitoring()]:::mth
  N1603 --> N1607
  N1608[stopMonitoring()]:::mth
  N1603 --> N1608
  N1609[Class: MockConcurrencyController]:::cls
  N1590 --> N1609
  N1610[getSystemResources()]:::mth
  N1609 --> N1610
  N1611[getCurrentMemoryUsage()]:::mth
  N1609 --> N1611
  N1612[hasSufficientResources()]:::mth
  N1609 --> N1612
  N1613[startMonitoring()]:::mth
  N1609 --> N1613
  N1614[stopMonitoring()]:::mth
  N1609 --> N1614
  N1615[Class: MockTypeScriptCompilationManager]:::cls
  N1590 --> N1615
  N1616[getSystemResources()]:::mth
  N1615 --> N1616
  N1617[getCurrentMemoryUsage()]:::mth
  N1615 --> N1617
  N1618[hasSufficientResources()]:::mth
  N1615 --> N1618
  N1619[startMonitoring()]:::mth
  N1615 --> N1619
  N1620[stopMonitoring()]:::mth
  N1615 --> N1620
  N1621[File: BuildOrchestrator.ts]:::file
  N1504 --> N1621
  N1622[Class: BuildOrchestrator]:::cls
  N1621 --> N1622
  N1623[executeBuild()]:::mth
  N1622 --> N1623
  N1624[determineOptimalStrategy()]:::mth
  N1622 --> N1624
  N1625[monitorAndAdjust()]:::mth
  N1622 --> N1625
  N1626[onBuildEvent()]:::mth
  N1622 --> N1626
  N1627[stopBuild()]:::mth
  N1622 --> N1627
  N1629[File: BuildStrategyManager.ts]:::file
  N1504 --> N1629
  N1630[Class: ConfigurationValidationError]:::cls
  N1629 --> N1630
  N1631[getStrategy()]:::mth
  N1630 --> N1631
  N1632[registerStrategy()]:::mth
  N1630 --> N1632
  N1633[getAvailableStrategies()]:::mth
  N1630 --> N1633
  N1634[selectOptimalStrategy()]:::mth
  N1630 --> N1634
  N1635[createConfigurationFromEnvironment()]:::mth
  N1630 --> N1635
  N1636[Class: BuildStrategyManager]:::cls
  N1629 --> N1636
  N1637[getStrategy()]:::mth
  N1636 --> N1637
  N1638[registerStrategy()]:::mth
  N1636 --> N1638
  N1639[getAvailableStrategies()]:::mth
  N1636 --> N1639
  N1640[selectOptimalStrategy()]:::mth
  N1636 --> N1640
  N1641[createConfigurationFromEnvironment()]:::mth
  N1636 --> N1641
  N1642[File: index.ts]:::file
  N1504 --> N1642
  N1643[Class: and]:::cls
  N1642 --> N1643
  N1645[File: MemoryMonitor.ts]:::file
  N1504 --> N1645
  N1646[Class: MemoryMonitor]:::cls
  N1645 --> N1646
  N1647[getInstance()]:::mth
  N1646 --> N1647
  N1648[startMonitoring()]:::mth
  N1646 --> N1648
  N1649[stopMonitoring()]:::mth
  N1646 --> N1649
  N1650[getCurrentUsage()]:::mth
  N1646 --> N1650
  N1651[setThreshold()]:::mth
  N1646 --> N1651
  N1653[File: SystemResourceDetector.ts]:::file
  N1504 --> N1653
  N1654[Class: SystemResourceDetector]:::cls
  N1653 --> N1654
  N1655[getInstance()]:::mth
  N1654 --> N1655
  N1656[getSystemResources()]:::mth
  N1654 --> N1656
  N1657[getCurrentMemoryUsage()]:::mth
  N1654 --> N1657
  N1658[hasSufficientResources()]:::mth
  N1654 --> N1658
  N1659[getTotalMemoryMB()]:::mth
  N1654 --> N1659
  N1662[File: MemoryCleanupUtility.ts]:::file
  N1504 --> N1662
  N1663[Class: MemoryCleanupUtility]:::cls
  N1662 --> N1663
  N1664[performCleanup()]:::mth
  N1663 --> N1664
  N1665[forceGarbageCollection()]:::mth
  N1663 --> N1665
  N1666[clearModuleCache()]:::mth
  N1663 --> N1666
  N1667[clearTypeScriptCompilerMemory()]:::mth
  N1663 --> N1667
  N1668[verifyMemoryCleanup()]:::mth
  N1663 --> N1668
  N1670[File: TypeScriptCompilationManager.ts]:::file
  N1504 --> N1670
  N1671[Class: TypeScriptCompilationManager]:::cls
  N1670 --> N1671
  N1672[compileProjects()]:::mth
  N1671 --> N1672
  N1673[enableIncrementalCompilation()]:::mth
  N1671 --> N1673
  N1674[cleanupCompilerMemory()]:::mth
  N1671 --> N1674
  N1675[getCompilationMetrics()]:::mth
  N1671 --> N1675
  N1676[getMemoryCleanupStatistics()]:::mth
  N1671 --> N1676
  N1679[cache]:::pkg
  TNF --> N1679
  N1680[File: CacheService.ts]:::file
  N1679 --> N1680
  N1681[Class: CacheService]:::cls
  N1680 --> N1681
  N1682[set()]:::mth
  N1681 --> N1682
  N1683[delete()]:::mth
  N1681 --> N1683
  N1684[clear()]:::mth
  N1681 --> N1684
  N1685[invalidateByTag()]:::mth
  N1681 --> N1685
  N1686[tagKey()]:::mth
  N1681 --> N1686
  N1687[File: redis-cache.service.ts]:::file
  N1679 --> N1687
  N1688[Class: RedisCacheService]:::cls
  N1687 --> N1688
  N1689[delete()]:::mth
  N1688 --> N1689
  N1690[invalidateByTag()]:::mth
  N1688 --> N1690
  N1691[cacheAgent()]:::mth
  N1688 --> N1691
  N1692[getAgent()]:::mth
  N1688 --> N1692
  N1693[cacheWorkflow()]:::mth
  N1688 --> N1693
  N1694[claude-skills]:::pkg
  TNF --> N1694
  N1696[File: mcp-integration.ts]:::file
  N1694 --> N1696
  N1697[Class: MockMCPServer]:::cls
  N1696 --> N1697
  N1698[registerResource()]:::mth
  N1697 --> N1698
  N1699[registerTool()]:::mth
  N1697 --> N1699
  N1700[getResourcesCount()]:::mth
  N1697 --> N1700
  N1701[getToolsCount()]:::mth
  N1697 --> N1701
  N1702[listResources()]:::mth
  N1697 --> N1702
  N1703[File: ClaudeSkillsManager.ts]:::file
  N1694 --> N1703
  N1704[Class: for]:::cls
  N1703 --> N1704
  N1705[initialize()]:::mth
  N1704 --> N1705
  N1706[loadSkills()]:::mth
  N1704 --> N1706
  N1707[reloadSkills()]:::mth
  N1704 --> N1707
  N1708[executeSkill()]:::mth
  N1704 --> N1708
  N1709[getSkill()]:::mth
  N1704 --> N1709
  N1710[Class: ClaudeSkillsManager]:::cls
  N1703 --> N1710
  N1711[initialize()]:::mth
  N1710 --> N1711
  N1712[loadSkills()]:::mth
  N1710 --> N1712
  N1713[reloadSkills()]:::mth
  N1710 --> N1713
  N1714[executeSkill()]:::mth
  N1710 --> N1714
  N1715[getSkill()]:::mth
  N1710 --> N1715
  N1716[File: SkillExecutor.ts]:::file
  N1694 --> N1716
  N1717[Class: SkillExecutor]:::cls
  N1716 --> N1717
  N1718[registerSkill()]:::mth
  N1717 --> N1718
  N1719[unregisterSkill()]:::mth
  N1717 --> N1719
  N1720[getSkill()]:::mth
  N1717 --> N1720
  N1721[execute()]:::mth
  N1717 --> N1721
  N1722[validate()]:::mth
  N1717 --> N1722
  N1725[File: MCPSkillProvider.ts]:::file
  N1694 --> N1725
  N1726[Class: MCPSkillProvider]:::cls
  N1725 --> N1726
  N1727[getSkillResources()]:::mth
  N1726 --> N1727
  N1728[getSkillContent()]:::mth
  N1726 --> N1728
  N1729[getSkillTools()]:::mth
  N1726 --> N1729
  N1730[executeSkillTool()]:::mth
  N1726 --> N1730
  N1731[searchSkills()]:::mth
  N1726 --> N1731
  N1733[File: SkillLoader.ts]:::file
  N1694 --> N1733
  N1734[Class: SkillLoader]:::cls
  N1733 --> N1734
  N1735[initialize()]:::mth
  N1734 --> N1735
  N1736[loadAllSkills()]:::mth
  N1734 --> N1736
  N1737[loadSkillsByName()]:::mth
  N1734 --> N1737
  N1738[loadSkill()]:::mth
  N1734 --> N1738
  N1739[listAvailableSkills()]:::mth
  N1734 --> N1739
  N1741[File: SkillParser.ts]:::file
  N1694 --> N1741
  N1742[Class: SkillParser]:::cls
  N1741 --> N1742
  N1743[parseSkillFile()]:::mth
  N1742 --> N1743
  N1744[parseSkillDirectory()]:::mth
  N1742 --> N1744
  N1745[generateSkillId()]:::mth
  N1742 --> N1745
  N1746[inferCategory()]:::mth
  N1742 --> N1746
  N1747[extractTags()]:::mth
  N1742 --> N1747
  N1749[File: SkillRegistry.ts]:::file
  N1694 --> N1749
  N1750[Class: SkillRegistry]:::cls
  N1749 --> N1750
  N1751[register()]:::mth
  N1750 --> N1751
  N1752[unregister()]:::mth
  N1750 --> N1752
  N1753[get()]:::mth
  N1750 --> N1753
  N1754[list()]:::mth
  N1750 --> N1754
  N1755[search()]:::mth
  N1750 --> N1755
  N1758[cli]:::pkg
  TNF --> N1758
  N1762[client]:::pkg
  TNF --> N1762
  N1763[common]:::pkg
  TNF --> N1763
  N1766[communication]:::pkg
  TNF --> N1766
  N1767[compounding-memory]:::pkg
  TNF --> N1767
  N1768[contracts]:::pkg
  TNF --> N1768
  N1770[contracts-legacy]:::pkg
  TNF --> N1770
  N1771[core]:::pkg
  TNF --> N1771
  N1772[File: AnalyticsManager.ts]:::file
  N1771 --> N1772
  N1773[Class: AnalyticsManager]:::cls
  N1772 --> N1773
  N1792[File: AgentProcessor.ts]:::file
  N1771 --> N1792
  N1793[Class: AgentProcessor]:::cls
  N1792 --> N1793
  N1794[processAgent()]:::mth
  N1793 --> N1794
  N1795[updateAgentStatus()]:::mth
  N1793 --> N1795
  N1796[validateAgentConfig()]:::mth
  N1793 --> N1796
  N1797[executeAgentTasks()]:::mth
  N1793 --> N1797
  N1798[File: AgentCommunicationBridge.ts]:::file
  N1771 --> N1798
  N1799[Class: AgentCommunicationBridge]:::cls
  N1798 --> N1799
  N1800[validate()]:::mth
  N1799 --> N1800
  N1801[sendMessage()]:::mth
  N1799 --> N1801
  N1802[subscribeToMessages()]:::mth
  N1799 --> N1802
  N1803[sendDirectMessage()]:::mth
  N1799 --> N1803
  N1804[broadcastMessage()]:::mth
  N1799 --> N1804
  N1805[File: AgentCommunicationManager.ts]:::file
  N1771 --> N1805
  N1806[Class: AgentCommunicationManager]:::cls
  N1805 --> N1806
  N1807[createChannel()]:::mth
  N1806 --> N1807
  N1808[sendMessage()]:::mth
  N1806 --> N1808
  N1809[broadcastMessage()]:::mth
  N1806 --> N1809
  N1810[closeChannel()]:::mth
  N1806 --> N1810
  N1811[getChannel()]:::mth
  N1806 --> N1811
  N1812[File: AgentSwarmOrchestrationService.ts]:::file
  N1771 --> N1812
  N1813[Class: AgentSwarmOrchestrationService]:::cls
  N1812 --> N1813
  N1814[initializeSwarm()]:::mth
  N1813 --> N1814
  N1815[getSwarmStatus()]:::mth
  N1813 --> N1815
  N1816[start()]:::mth
  N1813 --> N1816
  N1817[stop()]:::mth
  N1813 --> N1817
  N1818[getState()]:::mth
  N1813 --> N1818
  N1819[File: AgentWorkflowManager.ts]:::file
  N1771 --> N1819
  N1820[Class: AgentWorkflowManager]:::cls
  N1819 --> N1820
  N1821[createWorkflow()]:::mth
  N1820 --> N1821
  N1822[startWorkflow()]:::mth
  N1820 --> N1822
  N1823[pauseWorkflow()]:::mth
  N1820 --> N1823
  N1824[cancelWorkflow()]:::mth
  N1820 --> N1824
  N1825[getWorkflow()]:::mth
  N1820 --> N1825
  N1826[File: WorkflowValidator.ts]:::file
  N1771 --> N1826
  N1827[Class: WorkflowValidator]:::cls
  N1826 --> N1827
  N1828[validateWorkflow()]:::mth
  N1827 --> N1828
  N1829[validateBasicStructure()]:::mth
  N1827 --> N1829
  N1830[validateTasks()]:::mth
  N1827 --> N1830
  N1831[validateDependencies()]:::mth
  N1827 --> N1831
  N1832[detectCircularDependencies()]:::mth
  N1827 --> N1832
  N1839[File: augment-message.ts]:::file
  N1771 --> N1839
  N1840[Class: MessageFactory]:::cls
  N1839 --> N1840
  N1843[File: collaboration-context.ts]:::file
  N1771 --> N1843
  N1844[Class: CollaborationContextManager]:::cls
  N1843 --> N1844
  N1845[enqueue()]:::mth
  N1844 --> N1845
  N1846[getContext()]:::mth
  N1844 --> N1846
  N1847[updatePhase()]:::mth
  N1844 --> N1847
  N1848[setActiveTask()]:::mth
  N1844 --> N1848
  N1849[addAgentTask()]:::mth
  N1844 --> N1849
  N1850[Class: DefaultPriorityQueue]:::cls
  N1843 --> N1850
  N1851[enqueue()]:::mth
  N1850 --> N1851
  N1852[getContext()]:::mth
  N1850 --> N1852
  N1853[updatePhase()]:::mth
  N1850 --> N1853
  N1854[setActiveTask()]:::mth
  N1850 --> N1854
  N1855[addAgentTask()]:::mth
  N1850 --> N1855
  N1857[File: initialization.ts]:::file
  N1771 --> N1857
  N1858[Class: AgentInitializationService]:::cls
  N1857 --> N1858
  N1859[initializeAgent()]:::mth
  N1858 --> N1859
  N1860[isInitialized()]:::mth
  N1858 --> N1860
  N1861[getInitializedAgents()]:::mth
  N1858 --> N1861
  N1862[getAgentInfo()]:::mth
  N1858 --> N1862
  N1863[getAllAgentsInfo()]:::mth
  N1858 --> N1863
  N1865[File: SemanticSkillDiscovery.ts]:::file
  N1771 --> N1865
  N1866[Class: SemanticSkillDiscoveryImpl]:::cls
  N1865 --> N1866
  N1867[findSkillsByExample()]:::mth
  N1866 --> N1867
  N1871[File: VectorMemorySystem.ts]:::file
  N1771 --> N1871
  N1872[Class: VectorMemorySystemImpl]:::cls
  N1871 --> N1872
  N1873[search()]:::mth
  N1872 --> N1873
  N1878[File: ContextAwareOrchestrator.ts]:::file
  N1771 --> N1878
  N1879[Class: ContextAwareOrchestrator]:::cls
  N1878 --> N1879
  N1880[planTaskWithContext()]:::mth
  N1879 --> N1880
  N1881[synthesizeApproach()]:::mth
  N1879 --> N1881
  N1882[calculateConfidence()]:::mth
  N1879 --> N1882
  N1889[File: sub-task-lifecycle-manager.ts]:::file
  N1771 --> N1889
  N1890[Class: SubTaskLifecycleManager]:::cls
  N1889 --> N1890
  N1891[planSubTasks()]:::mth
  N1890 --> N1891
  N1892[delegateSubTask()]:::mth
  N1890 --> N1892
  N1898[File: agent-workflow.service.ts]:::file
  N1771 --> N1898
  N1899[Class: AgentWorkflowService]:::cls
  N1898 --> N1899
  N1900[setupWorkflowEventListeners()]:::mth
  N1899 --> N1900
  N1901[createWorkflow()]:::mth
  N1899 --> N1901
  N1902[executeWorkflow()]:::mth
  N1899 --> N1902
  N1903[executeSteps()]:::mth
  N1899 --> N1903
  N1904[executeStep()]:::mth
  N1899 --> N1904
  N1905[File: ai-service.ts]:::file
  N1771 --> N1905
  N1906[Class: AIService]:::cls
  N1905 --> N1906
  N1907[initializeModels()]:::mth
  N1906 --> N1907
  N1908[getModel()]:::mth
  N1906 --> N1908
  N1909[getAllModels()]:::mth
  N1906 --> N1909
  N1910[getModelsByProvider()]:::mth
  N1906 --> N1910
  N1911[generateResponse()]:::mth
  N1906 --> N1911
  N1912[File: AnalysisManager.ts]:::file
  N1771 --> N1912
  N1913[Class: AnalysisManager]:::cls
  N1912 --> N1913
  N1914[analyzeCode()]:::mth
  N1913 --> N1914
  N1915[analyzeCodeQuality()]:::mth
  N1913 --> N1915
  N1916[analyzeSecurity()]:::mth
  N1913 --> N1916
  N1917[analyzePerformance()]:::mth
  N1913 --> N1917
  N1918[analyzeDependencies()]:::mth
  N1913 --> N1918
  N1919[File: AnalysisVisualizer.ts]:::file
  N1771 --> N1919
  N1920[Class: AnalysisVisualizer]:::cls
  N1919 --> N1920
  N1921[visualizeAnalysis()]:::mth
  N1920 --> N1921
  N1922[visualizeByType()]:::mth
  N1920 --> N1922
  N1923[generateJsonVisualization()]:::mth
  N1920 --> N1923
  N1924[generateHtmlVisualization()]:::mth
  N1920 --> N1924
  N1925[generateSvgVisualization()]:::mth
  N1920 --> N1925
  N1926[File: RedundancyDetector.ts]:::file
  N1771 --> N1926
  N1927[Class: RedundancyDetector]:::cls
  N1926 --> N1927
  N1928[addComponent()]:::mth
  N1927 --> N1928
  N1929[detectRedundancy()]:::mth
  N1927 --> N1929
  N1930[findSimilarComponents()]:::mth
  N1927 --> N1930
  N1931[calculateSimilarity()]:::mth
  N1927 --> N1931
  N1932[getSharedFunctionality()]:::mth
  N1927 --> N1932
  N1934[File: dependency.mapper.ts]:::file
  N1771 --> N1934
  N1935[Class: DependencyMapper]:::cls
  N1934 --> N1935
  N1936[mapToDependencyInfo()]:::mth
  N1935 --> N1936
  N1937[mapToVulnerabilityInfo()]:::mth
  N1935 --> N1937
  N1938[mapDependencyArray()]:::mth
  N1935 --> N1938
  N1939[File: performance.analyzer.ts]:::file
  N1771 --> N1939
  N1940[Class: PerformanceAnalyzer]:::cls
  N1939 --> N1940
  N1941[analyzePerformance()]:::mth
  N1940 --> N1941
  N1942[collectMetrics()]:::mth
  N1940 --> N1942
  N1943[detectIssues()]:::mth
  N1940 --> N1943
  N1944[mapMetricToIssueType()]:::mth
  N1940 --> N1944
  N1945[calculateScore()]:::mth
  N1940 --> N1945
  N1947[File: code.quality.analyzer.ts]:::file
  N1771 --> N1947
  N1948[Class: CodeQualityAnalyzer]:::cls
  N1947 --> N1948
  N1949[analyzeFile()]:::mth
  N1948 --> N1949
  N1950[analyzeLintIssues()]:::mth
  N1948 --> N1950
  N1951[analyzeComplexity()]:::mth
  N1948 --> N1951
  N1952[analyzeMaintainability()]:::mth
  N1948 --> N1952
  N1953[calculateScore()]:::mth
  N1948 --> N1953
  N1954[File: security.scanner.ts]:::file
  N1771 --> N1954
  N1955[Class: SecurityScanner]:::cls
  N1954 --> N1955
  N1956[scanFile()]:::mth
  N1955 --> N1956
  N1957[scanProject()]:::mth
  N1955 --> N1957
  N1958[calculateSummary()]:::mth
  N1955 --> N1958
  N1959[calculateSecurityScore()]:::mth
  N1955 --> N1959
  N1960[File: ErrorAnalytics.ts]:::file
  N1771 --> N1960
  N1961[Class: ErrorAnalytics]:::cls
  N1960 --> N1961
  N1962[trackError()]:::mth
  N1961 --> N1962
  N1963[getMetrics()]:::mth
  N1961 --> N1963
  N1964[getRecentErrors()]:::mth
  N1961 --> N1964
  N1965[getErrorsByType()]:::mth
  N1961 --> N1965
  N1966[getCriticalErrors()]:::mth
  N1961 --> N1966
  N1967[File: PerformanceAnalytics.ts]:::file
  N1771 --> N1967
  N1968[Class: PerformanceAnalytics]:::cls
  N1967 --> N1968
  N1969[recordRequest()]:::mth
  N1968 --> N1969
  N1970[getMetrics()]:::mth
  N1968 --> N1970
  N1971[getEndpointMetrics()]:::mth
  N1968 --> N1971
  N1972[getSlowRequests()]:::mth
  N1968 --> N1972
  N1973[getTopEndpoints()]:::mth
  N1968 --> N1973
  N1974[File: UsageAnalytics.ts]:::file
  N1771 --> N1974
  N1975[Class: UsageAnalytics]:::cls
  N1974 --> N1975
  N1976[trackUsage()]:::mth
  N1975 --> N1976
  N1977[getMetrics()]:::mth
  N1975 --> N1977
  N1978[getUserMetrics()]:::mth
  N1975 --> N1978
  N1979[getFeatureMetrics()]:::mth
  N1975 --> N1979
  N1980[getRetentionMetrics()]:::mth
  N1975 --> N1980
  N1981[File: api-versioning.service.ts]:::file
  N1771 --> N1981
  N1982[Class: ApiVersioningService]:::cls
  N1981 --> N1982
  N1983[extractVersion()]:::mth
  N1982 --> N1983
  N1984[addVersionHeaders()]:::mth
  N1982 --> N1984
  N1985[isVersionSupported()]:::mth
  N1982 --> N1985
  N1986[isVersionDeprecated()]:::mth
  N1982 --> N1986
  N1987[getSunsetDate()]:::mth
  N1982 --> N1987
  N1988[File: api.module.ts]:::file
  N1771 --> N1988
  N1989[Class: ApiModule]:::cls
  N1988 --> N1989
  N1990[File: SmartAPIGateway.ts]:::file
  N1771 --> N1990
  N1991[Class: SmartAPIGateway]:::cls
  N1990 --> N1991
  N1992[registerRoute()]:::mth
  N1991 --> N1992
  N1993[handleRequest()]:::mth
  N1991 --> N1993
  N1994[File: api-client-factory.ts]:::file
  N1771 --> N1994
  N1995[Class: ApiClientFactory]:::cls
  N1994 --> N1995
  N1996[createClient()]:::mth
  N1995 --> N1996
  N1997[createRetryClient()]:::mth
  N1995 --> N1997
  N1998[shouldRetry()]:::mth
  N1995 --> N1998
  N1999[delay()]:::mth
  N1995 --> N1999
  N2001[File: provider-registry.ts]:::file
  N1771 --> N2001
  N2002[Class: ProviderRegistry]:::cls
  N2001 --> N2002
  N2003[registerProvider()]:::mth
  N2002 --> N2003
  N2004[unregisterProvider()]:::mth
  N2002 --> N2004
  N2005[getProvider()]:::mth
  N2002 --> N2005
  N2006[getAllProviders()]:::mth
  N2002 --> N2006
  N2007[getProviderModels()]:::mth
  N2002 --> N2007
  N2008[File: app.controller.ts]:::file
  N1771 --> N2008
  N2009[Class: AppController]:::cls
  N2008 --> N2009
  N2010[getHello()]:::mth
  N2009 --> N2010
  N2011[getHealth()]:::mth
  N2009 --> N2011
  N2012[File: app.service.ts]:::file
  N1771 --> N2012
  N2013[Class: AppService]:::cls
  N2012 --> N2013
  N2014[getHello()]:::mth
  N2013 --> N2014
  N2015[getVersion()]:::mth
  N2013 --> N2015
  N2016[getStatus()]:::mth
  N2013 --> N2016
  N2017[File: auth.module.ts]:::file
  N1771 --> N2017
  N2018[Class: AuthModule]:::cls
  N2017 --> N2018
  N2019[File: auth.service.ts]:::file
  N1771 --> N2019
  N2020[Class: AuthService]:::cls
  N2019 --> N2020
  N2021[validateUser()]:::mth
  N2020 --> N2021
  N2022[login()]:::mth
  N2020 --> N2022
  N2023[register()]:::mth
  N2020 --> N2023
  N2024[validateToken()]:::mth
  N2020 --> N2024
  N2026[File: roles.guard.ts]:::file
  N1771 --> N2026
  N2027[Class: RolesGuard]:::cls
  N2026 --> N2027
  N2028[canActivate()]:::mth
  N2027 --> N2028
  N2033[File: assetClassifier.ts]:::file
  N1771 --> N2033
  N2034[Class: AssetClassifier]:::cls
  N2033 --> N2034
  N2035[classify()]:::mth
  N2034 --> N2035
  N2036[extractTags()]:::mth
  N2034 --> N2036
  N2037[generateSummary()]:::mth
  N2034 --> N2037
  N2038[File: assetEvaluator.ts]:::file
  N1771 --> N2038
  N2039[Class: AssetEvaluator]:::cls
  N2038 --> N2039
  N2040[evaluate()]:::mth
  N2039 --> N2040
  N2041[_calculateScore()]:::mth
  N2039 --> N2041
  N2042[_generateRecommendation()]:::mth
  N2039 --> N2042
  N2043[_identifyRisks()]:::mth
  N2039 --> N2043
  N2044[_identifyAdaptations()]:::mth
  N2039 --> N2044
  N2045[File: assetRegistry.ts]:::file
  N1771 --> N2045
  N2046[Class: Graph]:::cls
  N2045 --> N2046
  N2047[setEdge()]:::mth
  N2046 --> N2047
  N2048[getEdge()]:::mth
  N2046 --> N2048
  N2049[removeEdge()]:::mth
  N2046 --> N2049
  N2050[getSuccessors()]:::mth
  N2046 --> N2050
  N2051[registerAsset()]:::mth
  N2046 --> N2051
  N2052[Class: AssetRegistry]:::cls
  N2045 --> N2052
  N2053[setEdge()]:::mth
  N2052 --> N2053
  N2054[getEdge()]:::mth
  N2052 --> N2054
  N2055[removeEdge()]:::mth
  N2052 --> N2055
  N2056[getSuccessors()]:::mth
  N2052 --> N2056
  N2057[registerAsset()]:::mth
  N2052 --> N2057
  N2058[File: assetTracker.ts]:::file
  N1771 --> N2058
  N2059[Class: AssetTracker]:::cls
  N2058 --> N2059
  N2060[trackAssetUsage()]:::mth
  N2059 --> N2060
  N2061[updateUsagePatterns()]:::mth
  N2059 --> N2061
  N2062[getAssetAnalysis()]:::mth
  N2059 --> N2062
  N2063[getUsageStats()]:::mth
  N2059 --> N2063
  N2064[addPerformanceMetric()]:::mth
  N2059 --> N2064
  N2066[File: CommunicationModule.ts]:::file
  N1771 --> N2066
  N2067[Class: CommunicationModule]:::cls
  N2066 --> N2067
  N2068[File: CommunicationProtocol.ts]:::file
  N1771 --> N2068
  N2069[Class: CommunicationProtocol]:::cls
  N2068 --> N2069
  N2070[handle()]:::mth
  N2069 --> N2070
  N2071[registerHandler()]:::mth
  N2069 --> N2071
  N2072[processMessage()]:::mth
  N2069 --> N2072
  N2073[createMessage()]:::mth
  N2069 --> N2073
  N2074[File: CommunicationService.ts]:::file
  N1771 --> N2074
  N2075[Class: CommunicationService]:::cls
  N2074 --> N2075
  N2076[connectUser()]:::mth
  N2075 --> N2076
  N2077[disconnectUser()]:::mth
  N2075 --> N2077
  N2078[sendMessage()]:::mth
  N2075 --> N2078
  N2079[broadcastMessage()]:::mth
  N2075 --> N2079
  N2080[processIncomingMessage()]:::mth
  N2075 --> N2080
  N2082[File: MessageBroker.ts]:::file
  N1771 --> N2082
  N2083[Class: MessageBroker]:::cls
  N2082 --> N2083
  N2084[handle()]:::mth
  N2083 --> N2084
  N2085[publish()]:::mth
  N2083 --> N2085
  N2086[subscribe()]:::mth
  N2083 --> N2086
  N2087[unsubscribe()]:::mth
  N2083 --> N2087
  N2088[processMessage()]:::mth
  N2083 --> N2088
  N2089[File: MessageRouter.ts]:::file
  N1771 --> N2089
  N2090[Class: MessageRouter]:::cls
  N2089 --> N2090
  N2091[addRule()]:::mth
  N2090 --> N2091
  N2092[removeRule()]:::mth
  N2090 --> N2092
  N2093[routeMessage()]:::mth
  N2090 --> N2093
  N2094[getRules()]:::mth
  N2090 --> N2094
  N2095[File: MessageValidator.ts]:::file
  N1771 --> N2095
  N2096[Class: MessageValidator]:::cls
  N2095 --> N2096
  N2097[addRules()]:::mth
  N2096 --> N2097
  N2098[validate()]:::mth
  N2096 --> N2098
  N2099[getNestedValue()]:::mth
  N2096 --> N2099
  N2100[hasRules()]:::mth
  N2096 --> N2100
  N2101[getRules()]:::mth
  N2096 --> N2101
  N2102[File: MessagingService.ts]:::file
  N1771 --> N2102
  N2103[Class: MessagingService]:::cls
  N2102 --> N2103
  N2104[super()]:::mth
  N2103 --> N2104
  N2105[sendMessage()]:::mth
  N2103 --> N2105
  N2106[createChannel()]:::mth
  N2103 --> N2106
  N2107[createSubscription()]:::mth
  N2103 --> N2107
  N2108[deleteSubscription()]:::mth
  N2103 --> N2108
  N2109[File: NotificationService.ts]:::file
  N1771 --> N2109
  N2110[Class: NotificationService]:::cls
  N2109 --> N2110
  N2111[super()]:::mth
  N2110 --> N2111
  N2112[loadNotificationChannels()]:::mth
  N2110 --> N2112
  N2113[loadNotificationTemplates()]:::mth
  N2110 --> N2113
  N2114[loadNotificationPreferences()]:::mth
  N2110 --> N2114
  N2115[sendNotification()]:::mth
  N2110 --> N2115
  N2119[File: DirectorMonitoringService.ts]:::file
  N1771 --> N2119
  N2120[Class: DirectorMonitoringService]:::cls
  N2119 --> N2120
  N2121[updateDirectorStatus()]:::mth
  N2120 --> N2121
  N2122[getDirectorStatus()]:::mth
  N2120 --> N2122
  N2123[getAllDirectorStatuses()]:::mth
  N2120 --> N2123
  N2124[checkDirectorHealth()]:::mth
  N2120 --> N2124
  N2125[File: ConfigService.ts]:::file
  N1771 --> N2125
  N2126[Class: ConfigService]:::cls
  N2125 --> N2126
  N2127[start()]:::mth
  N2126 --> N2127
  N2128[stop()]:::mth
  N2126 --> N2128
  N2129[getState()]:::mth
  N2126 --> N2129
  N2130[getEnvironment()]:::mth
  N2126 --> N2130
  N2131[isDevelopment()]:::mth
  N2126 --> N2131
  N2133[File: ConfigurationService.ts]:::file
  N1771 --> N2133
  N2134[Class: ConfigurationService]:::cls
  N2133 --> N2134
  N2135[onModuleInit()]:::mth
  N2134 --> N2135
  N2136[loadSchemas()]:::mth
  N2134 --> N2136
  N2137[loadConfigurations()]:::mth
  N2134 --> N2137
  N2138[loadConfigFile()]:::mth
  N2134 --> N2138
  N2139[processConfigValue()]:::mth
  N2134 --> N2139
  N2144[File: DatabaseModule.ts]:::file
  N1771 --> N2144
  N2145[Class: DatabaseModule]:::cls
  N2144 --> N2145
  N2146[forRoot()]:::mth
  N2145 --> N2146
  N2147[File: DatabaseService.ts]:::file
  N1771 --> N2147
  N2148[Class: DatabaseService]:::cls
  N2147 --> N2148
  N2149[onModuleInit()]:::mth
  N2148 --> N2149
  N2150[onModuleDestroy()]:::mth
  N2148 --> N2150
  N2151[start()]:::mth
  N2148 --> N2151
  N2152[stop()]:::mth
  N2148 --> N2152
  N2153[getState()]:::mth
  N2148 --> N2153
  N2154[File: enhanced-database.service.ts]:::file
  N1771 --> N2154
  N2155[Class: EnhancedDatabaseService]:::cls
  N2154 --> N2155
  N2156[onModuleInit()]:::mth
  N2155 --> N2156
  N2157[onModuleDestroy()]:::mth
  N2155 --> N2157
  N2158[File: Log.ts]:::file
  N1771 --> N2158
  N2159[Class: Log]:::cls
  N2158 --> N2159
  N2160[File: Metric.ts]:::file
  N1771 --> N2160
  N2161[Class: Metric]:::cls
  N2160 --> N2161
  N2162[File: Session.ts]:::file
  N1771 --> N2162
  N2163[Class: Session]:::cls
  N2162 --> N2163
  N2164[generateToken()]:::mth
  N2163 --> N2164
  N2165[File: Task.ts]:::file
  N1771 --> N2165
  N2166[Class: Task]:::cls
  N2165 --> N2166
  N2167[File: User.ts]:::file
  N1771 --> N2167
  N2168[Class: User]:::cls
  N2167 --> N2168
  N2169[hashPassword()]:::mth
  N2168 --> N2169
  N2170[comparePassword()]:::mth
  N2168 --> N2170
  N2171[toJSON()]:::mth
  N2168 --> N2171
  N2172[File: 1694000000000_create_core_tables.ts]:::file
  N1771 --> N2172
  N2173[Class: CreateCoreTables1694000000000]:::cls
  N2172 --> N2173
  N2174[up()]:::mth
  N2173 --> N2174
  N2175[down()]:::mth
  N2173 --> N2175
  N2176[File: LogRepository.ts]:::file
  N1771 --> N2176
  N2177[Class: LogRepository]:::cls
  N2176 --> N2177
  N2178[findByLevel()]:::mth
  N2177 --> N2178
  N2179[findByTimeRange()]:::mth
  N2177 --> N2179
  N2180[searchLogs()]:::mth
  N2177 --> N2180
  N2181[getLogStatistics()]:::mth
  N2177 --> N2181
  N2182[getTopContexts()]:::mth
  N2177 --> N2182
  N2184[File: CallbackHandlerRegistry.ts]:::file
  N1771 --> N2184
  N2185[Class: CallbackHandlerRegistry]:::cls
  N2184 --> N2185
  N2186[registerHandler()]:::mth
  N2185 --> N2186
  N2187[executeHandlers()]:::mth
  N2185 --> N2187
  N2188[handleSubtaskCompleted()]:::mth
  N2185 --> N2188
  N2189[Class: CallbackHandlerRegistry]:::cls
  N2184 --> N2189
  N2190[registerHandler()]:::mth
  N2189 --> N2190
  N2191[executeHandlers()]:::mth
  N2189 --> N2191
  N2192[handleSubtaskCompleted()]:::mth
  N2189 --> N2192
  N2196[File: agent-prompt.entity.ts]:::file
  N1771 --> N2196
  N2197[Class: AgentPrompt]:::cls
  N2196 --> N2197
  N2198[File: agent-prompt_clean.entity.ts]:::file
  N1771 --> N2198
  N2199[Class: AgentPrompt]:::cls
  N2198 --> N2199
  N2200[File: agent.entity.ts]:::file
  N1771 --> N2200
  N2201[Class: Agent]:::cls
  N2200 --> N2201
  N2202[File: agent_clean.entity.ts]:::file
  N1771 --> N2202
  N2203[Class: Agent]:::cls
  N2202 --> N2203
  N2204[File: prompt.entity.ts]:::file
  N1771 --> N2204
  N2205[Class: PromptTemplate]:::cls
  N2204 --> N2205
  N2206[process()]:::mth
  N2205 --> N2206
  N2207[File: prompt_clean.entity.ts]:::file
  N1771 --> N2207
  N2208[Class: PromptTemplate]:::cls
  N2207 --> N2208
  N2209[process()]:::mth
  N2208 --> N2209
  N2210[File: ErrorHandlingService.ts]:::file
  N1771 --> N2210
  N2211[Class: ErrorHandlingService]:::cls
  N2210 --> N2211
  N2212[handle()]:::mth
  N2211 --> N2212
  N2213[File: ErrorRecoveryService.ts]:::file
  N1771 --> N2213
  N2214[Class: ErrorRecoveryService]:::cls
  N2213 --> N2214
  N2215[registerStrategy()]:::mth
  N2214 --> N2215
  N2216[handle()]:::mth
  N2214 --> N2216
  N2218[File: error-handler.ts]:::file
  N1771 --> N2218
  N2219[Class: ErrorHandler]:::cls
  N2218 --> N2219
  N2220[handle()]:::mth
  N2219 --> N2220
  N2221[File: error-recovery.service.ts]:::file
  N1771 --> N2221
  N2222[Class: ErrorRecoveryService]:::cls
  N2221 --> N2222
  N2223[handle()]:::mth
  N2222 --> N2223
  N2224[File: error-reporting.service.ts]:::file
  N1771 --> N2224
  N2225[Class: ErrorReportingService]:::cls
  N2224 --> N2225
  N2226[report()]:::mth
  N2225 --> N2226
  N2227[File: external-reporting.service.ts]:::file
  N1771 --> N2227
  N2228[Class: ExternalReportingService]:::cls
  N2227 --> N2228
  N2229[report()]:::mth
  N2228 --> N2229
  N2231[File: BaseRecoveryStrategy.ts]:::file
  N1771 --> N2231
  N2232[Class: BaseRecoveryStrategy]:::cls
  N2231 --> N2232
  N2236[File: HealthService.ts]:::file
  N1771 --> N2236
  N2237[Class: HealthService]:::cls
  N2236 --> N2237
  N2238[check()]:::mth
  N2237 --> N2238
  N2240[File: integration-registry.service.ts]:::file
  N1771 --> N2240
  N2241[Class: IntegrationRegistryService]:::cls
  N2240 --> N2241
  N2242[registerIntegration()]:::mth
  N2241 --> N2242
  N2243[unregisterIntegration()]:::mth
  N2241 --> N2243
  N2244[getIntegration()]:::mth
  N2241 --> N2244
  N2245[listIntegrations()]:::mth
  N2241 --> N2245
  N2246[findIntegrationsByCategory()]:::mth
  N2241 --> N2246
  N2247[File: youtube_integrator.ts]:::file
  N1771 --> N2247
  N2248[Class: YouTubeIntegrator]:::cls
  N2247 --> N2248
  N2249[fetchVideo()]:::mth
  N2248 --> N2249
  N2250[searchVideos()]:::mth
  N2248 --> N2250
  N2252[File: LearningModule.ts]:::file
  N1771 --> N2252
  N2253[Class: LearningModule]:::cls
  N2252 --> N2253
  N2254[File: LearningSystem.ts]:::file
  N1771 --> N2254
  N2255[Class: LearningSystem]:::cls
  N2254 --> N2255
  N2256[learn()]:::mth
  N2255 --> N2256
  N2258[File: PatternRecognition.ts]:::file
  N1771 --> N2258
  N2259[Class: PatternRecognition]:::cls
  N2258 --> N2259
  N2260[recognize()]:::mth
  N2259 --> N2260
  N2261[File: PatternRecognizer.ts]:::file
  N1771 --> N2261
  N2262[Class: PatternRecognizer]:::cls
  N2261 --> N2262
  N2263[recognize()]:::mth
  N2262 --> N2263
  N2264[File: SystemAdaptor.ts]:::file
  N1771 --> N2264
  N2265[Class: SystemAdaptor]:::cls
  N2264 --> N2265
  N2266[adapt()]:::mth
  N2265 --> N2266
  N2267[File: adaptor.ts]:::file
  N1771 --> N2267
  N2268[Class: Adaptor]:::cls
  N2267 --> N2268
  N2269[adapt()]:::mth
  N2268 --> N2269
  N2274[File: LLMProvider.ts]:::file
  N1771 --> N2274
  N2275[Class: LLMProvider]:::cls
  N2274 --> N2275
  N2276[File: MidsceneLLMAdapter.ts]:::file
  N1771 --> N2276
  N2277[Class: MidsceneLLMAdapter]:::cls
  N2276 --> N2277
  N2278[generate()]:::mth
  N2277 --> N2278
  N2279[File: prompt-caching.service.ts]:::file
  N1771 --> N2279
  N2280[Class: PromptCachingService]:::cls
  N2279 --> N2280
  N2281[buildCacheablePrompt()]:::mth
  N2280 --> N2281
  N2282[cacheSystemPrompt()]:::mth
  N2280 --> N2282
  N2283[cacheDocumentation()]:::mth
  N2280 --> N2283
  N2284[buildDynamicQuery()]:::mth
  N2280 --> N2284
  N2285[File: AnthropicProvider.ts]:::file
  N1771 --> N2285
  N2286[Class: AnthropicProvider]:::cls
  N2285 --> N2286
  N2287[generate()]:::mth
  N2286 --> N2287
  N2288[chat()]:::mth
  N2286 --> N2288
  N2289[await()]:::mth
  N2286 --> N2289
  N2290[convertMessages()]:::mth
  N2286 --> N2290
  N2291[countTokens()]:::mth
  N2286 --> N2291
  N2292[File: GeminiProvider.ts]:::file
  N1771 --> N2292
  N2293[Class: GeminiProvider]:::cls
  N2292 --> N2293
  N2294[generate()]:::mth
  N2293 --> N2294
  N2295[chat()]:::mth
  N2293 --> N2295
  N2296[await()]:::mth
  N2293 --> N2296
  N2297[convertMessages()]:::mth
  N2293 --> N2297
  N2298[getDefaultSafetySettings()]:::mth
  N2293 --> N2298
  N2299[File: GoogleADKProvider.ts]:::file
  N1771 --> N2299
  N2300[Class: GoogleADKProvider]:::cls
  N2299 --> N2300
  N2301[generate()]:::mth
  N2300 --> N2301
  N2302[chat()]:::mth
  N2300 --> N2302
  N2303[healthCheck()]:::mth
  N2300 --> N2303
  N2304[normalizeMessages()]:::mth
  N2300 --> N2304
  N2305[buildHeaders()]:::mth
  N2300 --> N2305
  N2306[File: OpenCodeApiProvider.ts]:::file
  N1771 --> N2306
  N2307[Class: OpenCodeApiProvider]:::cls
  N2306 --> N2307
  N2308[healthCheck()]:::mth
  N2307 --> N2308
  N2309[createSession()]:::mth
  N2307 --> N2309
  N2310[getSession()]:::mth
  N2307 --> N2310
  N2311[generate()]:::mth
  N2307 --> N2311
  N2312[chat()]:::mth
  N2307 --> N2312
  N2313[File: OpenCodeCliProvider.ts]:::file
  N1771 --> N2313
  N2314[Class: OpenCodeCliProvider]:::cls
  N2313 --> N2314
  N2315[generate()]:::mth
  N2314 --> N2315
  N2316[chat()]:::mth
  N2314 --> N2316
  N2317[messagesToPrompt()]:::mth
  N2314 --> N2317
  N2318[parseResponse()]:::mth
  N2314 --> N2318
  N2319[estimateTokens()]:::mth
  N2314 --> N2319
  N2333[File: MemoryManager.ts]:::file
  N1771 --> N2333
  N2334[Class: MemoryManager]:::cls
  N2333 --> N2334
  N2335[start()]:::mth
  N2334 --> N2335
  N2336[stop()]:::mth
  N2334 --> N2336
  N2337[getState()]:::mth
  N2334 --> N2337
  N2338[store()]:::mth
  N2334 --> N2338
  N2339[retrieve()]:::mth
  N2334 --> N2339
  N2340[File: MemorySystem.ts]:::file
  N1771 --> N2340
  N2341[Class: MemorySystem]:::cls
  N2340 --> N2341
  N2342[start()]:::mth
  N2341 --> N2342
  N2343[stop()]:::mth
  N2341 --> N2343
  N2344[getState()]:::mth
  N2341 --> N2344
  N2345[store()]:::mth
  N2341 --> N2345
  N2346[retrieve()]:::mth
  N2341 --> N2346
  N2347[File: VectorMemorySystem.ts]:::file
  N1771 --> N2347
  N2348[Class: VectorMemorySystem]:::cls
  N2347 --> N2348
  N2349[start()]:::mth
  N2348 --> N2349
  N2350[stop()]:::mth
  N2348 --> N2350
  N2351[store()]:::mth
  N2348 --> N2351
  N2352[retrieve()]:::mth
  N2348 --> N2352
  N2353[update()]:::mth
  N2348 --> N2353
  N2354[File: memory.service.ts]:::file
  N1771 --> N2354
  N2355[Class: MemoryService]:::cls
  N2354 --> N2355
  N2356[createMemory()]:::mth
  N2355 --> N2356
  N2357[findMemoryById()]:::mth
  N2355 --> N2357
  N2358[findMemoriesByType()]:::mth
  N2355 --> N2358
  N2359[updateMemory()]:::mth
  N2355 --> N2359
  N2360[deleteMemory()]:::mth
  N2355 --> N2360
  N2361[File: MemoryOptimizer.ts]:::file
  N1771 --> N2361
  N2362[Class: MemoryOptimizer]:::cls
  N2361 --> N2362
  N2363[optimize()]:::mth
  N2362 --> N2363
  N2364[analyzeMemoryUsage()]:::mth
  N2362 --> N2364
  N2365[identifyPruningCandidates()]:::mth
  N2362 --> N2365
  N2366[compressMemory()]:::mth
  N2362 --> N2366
  N2367[getOptimizationStats()]:::mth
  N2362 --> N2367
  N2369[File: MetricsService.ts]:::file
  N1771 --> N2369
  N2370[Class: MetricsService]:::cls
  N2369 --> N2370
  N2371[increment()]:::mth
  N2370 --> N2371
  N2372[gauge()]:::mth
  N2370 --> N2372
  N2373[File: cascade.middleware.ts]:::file
  N1771 --> N2373
  N2374[Class: CascadeMiddleware]:::cls
  N2373 --> N2374
  N2375[use()]:::mth
  N2374 --> N2375
  N2377[File: llm.module.ts]:::file
  N1771 --> N2377
  N2378[Class: LlmModule]:::cls
  N2377 --> N2378
  N2380[File: AlertManager.ts]:::file
  N1771 --> N2380
  N2381[Class: AlertManager]:::cls
  N2380 --> N2381
  N2382[createAlert()]:::mth
  N2381 --> N2382
  N2383[checkAlerts()]:::mth
  N2381 --> N2383
  N2384[File: ErrorTrackingService.ts]:::file
  N1771 --> N2384
  N2385[Class: ErrorTrackingService]:::cls
  N2384 --> N2385
  N2386[captureException()]:::mth
  N2385 --> N2386
  N2388[File: AlertService.ts]:::file
  N1771 --> N2388
  N2389[Class: AlertService]:::cls
  N2388 --> N2389
  N2390[sendAlert()]:::mth
  N2389 --> N2390
  N2391[File: alerts.ts]:::file
  N1771 --> N2391
  N2392[Class: AlertsService]:::cls
  N2391 --> N2392
  N2393[trigger()]:::mth
  N2392 --> N2393
  N2394[File: error-dashboard.service.ts]:::file
  N1771 --> N2394
  N2395[Class: ErrorDashboardService]:::cls
  N2394 --> N2395
  N2396[reportError()]:::mth
  N2395 --> N2396
  N2397[File: error-monitoring.service.ts]:::file
  N1771 --> N2397
  N2398[Class: ErrorMonitoringService]:::cls
  N2397 --> N2398
  N2399[captureError()]:::mth
  N2398 --> N2399
  N2401[File: metrics.ts]:::file
  N1771 --> N2401
  N2402[Class: MetricsService]:::cls
  N2401 --> N2402
  N2403[increment()]:::mth
  N2402 --> N2403
  N2404[gauge()]:::mth
  N2402 --> N2404
  N2405[File: performance-monitor.service.ts]:::file
  N1771 --> N2405
  N2406[Class: PerformanceMonitorService]:::cls
  N2405 --> N2406
  N2407[startTimer()]:::mth
  N2406 --> N2407
  N2408[endTimer()]:::mth
  N2406 --> N2408
  N2409[File: performance.ts]:::file
  N1771 --> N2409
  N2410[Class: PerformanceService]:::cls
  N2409 --> N2410
  N2411[start()]:::mth
  N2410 --> N2411
  N2412[end()]:::mth
  N2410 --> N2412
  N2413[File: service-dependency-health.service.ts]:::file
  N1771 --> N2413
  N2414[Class: ServiceDependencyHealthService]:::cls
  N2413 --> N2414
  N2415[checkHealth()]:::mth
  N2414 --> N2415
  N2416[File: system-resource-monitor.service.ts]:::file
  N1771 --> N2416
  N2417[Class: SystemResourceMonitorService]:::cls
  N2416 --> N2417
  N2418[getMemoryUsage()]:::mth
  N2417 --> N2418
  N2419[getCpuUsage()]:::mth
  N2417 --> N2419
  N2420[getDiskUsage()]:::mth
  N2417 --> N2420
  N2422[File: unified-monitoring.service.ts]:::file
  N1771 --> N2422
  N2423[Class: UnifiedMonitoringService]:::cls
  N2422 --> N2423
  N2424[trackEvent()]:::mth
  N2423 --> N2424
  N2425[observeMetric()]:::mth
  N2423 --> N2425
  N2432[File: notification.handler.ts]:::file
  N1771 --> N2432
  N2433[Class: NotificationHandler]:::cls
  N2432 --> N2433
  N2434[handle()]:::mth
  N2433 --> N2434
  N2435[File: LoadBalancer.ts]:::file
  N1771 --> N2435
  N2436[Class: LoadBalancer]:::cls
  N2435 --> N2436
  N2437[addNode()]:::mth
  N2436 --> N2437
  N2438[removeNode()]:::mth
  N2436 --> N2438
  N2439[setStrategy()]:::mth
  N2436 --> N2439
  N2440[getNextNode()]:::mth
  N2436 --> N2440
  N2441[releaseNode()]:::mth
  N2436 --> N2441
  N2454[File: OpenAIProvider.ts]:::file
  N1771 --> N2454
  N2455[Class: OpenAIProvider]:::cls
  N2454 --> N2455
  N2456[generate()]:::mth
  N2455 --> N2456
  N2458[File: ResourceManager.ts]:::file
  N1771 --> N2458
  N2459[Class: ResourceManager]:::cls
  N2458 --> N2459
  N2460[onModuleDestroy()]:::mth
  N2459 --> N2460
  N2461[getCurrentUsage()]:::mth
  N2459 --> N2461
  N2462[releaseResource()]:::mth
  N2459 --> N2462
  N2463[logResourceUsage()]:::mth
  N2459 --> N2463
  N2470[File: auth.ts]:::file
  N1771 --> N2470
  N2471[Class: AuthService]:::cls
  N2470 --> N2471
  N2472[validateUser()]:::mth
  N2471 --> N2472
  N2473[login()]:::mth
  N2471 --> N2473
  N2475[File: metricsCollector.ts]:::file
  N1771 --> N2475
  N2476[Class: MetricsCollectorService]:::cls
  N2475 --> N2476
  N2477[onModuleInit()]:::mth
  N2476 --> N2477
  N2478[onModuleDestroy()]:::mth
  N2476 --> N2478
  N2479[start()]:::mth
  N2476 --> N2479
  N2480[stop()]:::mth
  N2476 --> N2480
  N2481[collectMetrics()]:::mth
  N2476 --> N2481
  N2482[File: metricsProcessor.ts]:::file
  N1771 --> N2482
  N2483[Class: MetricsProcessor]:::cls
  N2482 --> N2483
  N2484[onModuleInit()]:::mth
  N2483 --> N2484
  N2485[onModuleDestroy()]:::mth
  N2483 --> N2485
  N2486[trackEvent()]:::mth
  N2483 --> N2486
  N2487[processSystemMetrics()]:::mth
  N2483 --> N2487
  N2488[addToBuffer()]:::mth
  N2483 --> N2488
  N2489[File: security-headers.middleware.ts]:::file
  N1771 --> N2489
  N2490[Class: SecurityHeadersMiddleware]:::cls
  N2489 --> N2490
  N2491[use()]:::mth
  N2490 --> N2491
  N2492[File: monitoring.ts]:::file
  N1771 --> N2492
  N2493[Class: MonitoringService]:::cls
  N2492 --> N2493
  N2494[onModuleDestroy()]:::mth
  N2493 --> N2494
  N2495[increment()]:::mth
  N2493 --> N2495
  N2496[getSystemHealth()]:::mth
  N2493 --> N2496
  N2497[getTimingStats()]:::mth
  N2493 --> N2497
  N2498[getCounterStats()]:::mth
  N2493 --> N2498
  N2499[File: permission-manager.ts]:::file
  N1771 --> N2499
  N2500[Class: PermissionManager]:::cls
  N2499 --> N2500
  N2501[canAccess()]:::mth
  N2500 --> N2501
  N2502[File: progressTracker.ts]:::file
  N1771 --> N2502
  N2503[Class: ProgressTrackerService]:::cls
  N2502 --> N2503
  N2504[startTask()]:::mth
  N2503 --> N2504
  N2505[updateProgress()]:::mth
  N2503 --> N2505
  N2506[completeTask()]:::mth
  N2503 --> N2506
  N2507[failTask()]:::mth
  N2503 --> N2507
  N2508[getTaskStatus()]:::mth
  N2503 --> N2508
  N2509[File: security.service.ts]:::file
  N1771 --> N2509
  N2510[Class: SecurityService]:::cls
  N2509 --> N2510
  N2511[hashPassword()]:::mth
  N2510 --> N2511
  N2512[comparePassword()]:::mth
  N2510 --> N2512
  N2513[encryptText()]:::mth
  N2510 --> N2513
  N2514[decryptText()]:::mth
  N2510 --> N2514
  N2515[sanitizeInput()]:::mth
  N2510 --> N2515
  N2521[File: AgentCardService.ts]:::file
  N1771 --> N2521
  N2522[Class: AgentCardService]:::cls
  N2521 --> N2522
  N2523[createCard()]:::mth
  N2522 --> N2523
  N2524[getCard()]:::mth
  N2522 --> N2524
  N2525[updateCard()]:::mth
  N2522 --> N2525
  N2526[deleteCard()]:::mth
  N2522 --> N2526
  N2527[listCards()]:::mth
  N2522 --> N2527
  N2528[File: AgentFactory.ts]:::file
  N1771 --> N2528
  N2529[Class: AgentFactory]:::cls
  N2528 --> N2529
  N2530[createAgent()]:::mth
  N2529 --> N2530
  N2531[generateId()]:::mth
  N2529 --> N2531
  N2532[File: AgentLLMService.ts]:::file
  N1771 --> N2532
  N2533[Class: AgentLLMService]:::cls
  N2532 --> N2533
  N2534[generateResponse()]:::mth
  N2533 --> N2534
  N2535[streamResponse()]:::mth
  N2533 --> N2535
  N2536[callLLMAPI()]:::mth
  N2533 --> N2536
  N2537[createStreamResponse()]:::mth
  N2533 --> N2537
  N2538[validateModel()]:::mth
  N2533 --> N2538
  N2539[File: BMADOrchestrationService.ts]:::file
  N1771 --> N2539
  N2540[Class: BMADOrchestrationService]:::cls
  N2539 --> N2540
  N2541[TO()]:::mth
  N2540 --> N2541
  N2542[registerSkill()]:::mth
  N2540 --> N2542
  N2543[createComposition()]:::mth
  N2540 --> N2543
  N2544[composeSkills()]:::mth
  N2540 --> N2544
  N2545[createTool()]:::mth
  N2540 --> N2545
  N2546[File: CascadeService.ts]:::file
  N1771 --> N2546
  N2547[Class: CascadeService]:::cls
  N2546 --> N2547
  N2548[createController()]:::mth
  N2547 --> N2548
  N2549[addStep()]:::mth
  N2547 --> N2549
  N2550[executeController()]:::mth
  N2547 --> N2550
  N2551[cancelExecution()]:::mth
  N2547 --> N2551
  N2552[getController()]:::mth
  N2547 --> N2552
  N2553[File: CommunicationTracker.ts]:::file
  N1771 --> N2553
  N2554[Class: CommunicationTracker]:::cls
  N2553 --> N2554
  N2555[trackCommunication()]:::mth
  N2554 --> N2555
  N2556[getCommunicationHistory()]:::mth
  N2554 --> N2556
  N2557[getRecentCommunications()]:::mth
  N2554 --> N2557
  N2558[clearHistory()]:::mth
  N2554 --> N2558
  N2559[getMetrics()]:::mth
  N2554 --> N2559
  N2560[File: ConversationExportService.ts]:::file
  N1771 --> N2560
  N2561[Class: ConversationExportService]:::cls
  N2560 --> N2561
  N2562[exportConversation()]:::mth
  N2561 --> N2562
  N2563[exportToMarkdown()]:::mth
  N2561 --> N2563
  N2564[exportToJSON()]:::mth
  N2561 --> N2564
  N2565[File: DeploymentPipelineService.ts]:::file
  N1771 --> N2565
  N2566[Class: DeploymentPipelineService]:::cls
  N2565 --> N2566
  N2567[deployServices()]:::mth
  N2566 --> N2567
  N2568[validateConfig()]:::mth
  N2566 --> N2568
  N2569[deployService()]:::mth
  N2566 --> N2569
  N2570[runHealthChecks()]:::mth
  N2566 --> N2570
  N2571[generateDeploymentId()]:::mth
  N2566 --> N2571
  N2572[File: FeatureFlagService.ts]:::file
  N1771 --> N2572
  N2573[Class: FeatureFlagService]:::cls
  N2572 --> N2573
  N2574[createFeature()]:::mth
  N2573 --> N2574
  N2575[updateFeature()]:::mth
  N2573 --> N2575
  N2576[evaluateFeature()]:::mth
  N2573 --> N2576
  N2577[getFeatures()]:::mth
  N2573 --> N2577
  N2578[getFeatureByName()]:::mth
  N2573 --> N2578
  N2579[File: LocalAIDetectionService.ts]:::file
  N1771 --> N2579
  N2580[Class: LocalAIDetectionService]:::cls
  N2579 --> N2580
  N2581[start()]:::mth
  N2580 --> N2581
  N2582[stop()]:::mth
  N2580 --> N2582
  N2583[getState()]:::mth
  N2580 --> N2583
  N2584[detect()]:::mth
  N2580 --> N2584
  N2585[detectAvailableAIs()]:::mth
  N2580 --> N2585
  N2586[File: LoggingService.ts]:::file
  N1771 --> N2586
  N2587[Class: LoggingService]:::cls
  N2586 --> N2587
  N2588[initializeWinston()]:::mth
  N2587 --> N2588
  N2589[log()]:::mth
  N2587 --> N2589
  N2590[debug()]:::mth
  N2587 --> N2590
  N2591[info()]:::mth
  N2587 --> N2591
  N2592[warn()]:::mth
  N2587 --> N2592
  N2593[File: MessageClassifier.ts]:::file
  N1771 --> N2593
  N2594[Class: MessageClassifier]:::cls
  N2593 --> N2594
  N2595[classify()]:::mth
  N2594 --> N2595
  N2596[determinePriority()]:::mth
  N2594 --> N2596
  N2597[determineCategory()]:::mth
  N2594 --> N2597
  N2598[File: MetricsCollector.ts]:::file
  N1771 --> N2598
  N2599[Class: MetricsCollector]:::cls
  N2598 --> N2599
  N2600[start()]:::mth
  N2599 --> N2600
  N2601[stop()]:::mth
  N2599 --> N2601
  N2602[getState()]:::mth
  N2599 --> N2602
  N2603[collect()]:::mth
  N2599 --> N2603
  N2604[recordCounter()]:::mth
  N2599 --> N2604
  N2605[File: MetricsService.ts]:::file
  N1771 --> N2605
  N2606[Class: MetricsService]:::cls
  N2605 --> N2606
  N2607[recordMetric()]:::mth
  N2606 --> N2607
  N2608[getMetrics()]:::mth
  N2606 --> N2608
  N2609[getAllMetrics()]:::mth
  N2606 --> N2609
  N2610[getSnapshot()]:::mth
  N2606 --> N2610
  N2611[clearMetrics()]:::mth
  N2606 --> N2611
  N2612[File: MongoFeatureFlagService.ts]:::file
  N1771 --> N2612
  N2613[Class: MongoFeatureFlagService]:::cls
  N2612 --> N2613
  N2614[createFeature()]:::mth
  N2613 --> N2614
  N2615[updateFeature()]:::mth
  N2613 --> N2615
  N2616[evaluateFeature()]:::mth
  N2613 --> N2616
  N2617[getFeatures()]:::mth
  N2613 --> N2617
  N2618[getFeatureByName()]:::mth
  N2613 --> N2618
  N2619[Class: evaluation]:::cls
  N2612 --> N2619
  N2620[createFeature()]:::mth
  N2619 --> N2620
  N2621[updateFeature()]:::mth
  N2619 --> N2621
  N2622[evaluateFeature()]:::mth
  N2619 --> N2622
  N2623[getFeatures()]:::mth
  N2619 --> N2623
  N2624[getFeatureByName()]:::mth
  N2619 --> N2624
  N2625[File: MonitoringService.ts]:::file
  N1771 --> N2625
  N2626[Class: MonitoringService]:::cls
  N2625 --> N2626
  N2627[recordEvent()]:::mth
  N2626 --> N2627
  N2628[getEvents()]:::mth
  N2626 --> N2628
  N2629[getSystemHealth()]:::mth
  N2626 --> N2629
  N2630[checkDatabase()]:::mth
  N2626 --> N2630
  N2631[checkCache()]:::mth
  N2626 --> N2631
  N2632[File: PerformanceMonitor.ts]:::file
  N1771 --> N2632
  N2633[Class: PerformanceMonitor]:::cls
  N2632 --> N2633
  N2634[start()]:::mth
  N2633 --> N2634
  N2635[stop()]:::mth
  N2633 --> N2635
  N2636[getState()]:::mth
  N2633 --> N2636
  N2637[monitor()]:::mth
  N2633 --> N2637
  N2638[recordRequest()]:::mth
  N2633 --> N2638
  N2639[File: PromptService.ts]:::file
  N1771 --> N2639
  N2640[Class: PromptService]:::cls
  N2639 --> N2640
  N2641[initializeDefaultTemplates()]:::mth
  N2640 --> N2641
  N2642[createTemplate()]:::mth
  N2640 --> N2642
  N2643[getTemplate()]:::mth
  N2640 --> N2643
  N2644[getAllTemplates()]:::mth
  N2640 --> N2644
  N2645[getTemplatesByCategory()]:::mth
  N2640 --> N2645
  N2646[File: ReliabilityMetricsService.ts]:::file
  N1771 --> N2646
  N2647[Class: ReliabilityMetricsService]:::cls
  N2646 --> N2647
  N2648[setupEventListeners()]:::mth
  N2647 --> N2648
  N2649[getNegotiationSuccessRate()]:::mth
  N2647 --> N2649
  N2650[getSchemaErrorRate()]:::mth
  N2647 --> N2650
  N2651[File: SystemMonitor.ts]:::file
  N1771 --> N2651
  N2652[Class: SystemMonitor]:::cls
  N2651 --> N2652
  N2653[start()]:::mth
  N2652 --> N2653
  N2654[stop()]:::mth
  N2652 --> N2654
  N2655[getState()]:::mth
  N2652 --> N2655
  N2656[registerService()]:::mth
  N2652 --> N2656
  N2657[unregisterService()]:::mth
  N2652 --> N2657
  N2658[File: TaskService.ts]:::file
  N1771 --> N2658
  N2659[Class: TaskService]:::cls
  N2658 --> N2659
  N2660[createTask()]:::mth
  N2659 --> N2660
  N2661[getTask()]:::mth
  N2659 --> N2661
  N2662[updateTask()]:::mth
  N2659 --> N2662
  N2663[deleteTask()]:::mth
  N2659 --> N2663
  N2664[getTasks()]:::mth
  N2659 --> N2664
  N2665[File: UnifiedMonitoringService.ts]:::file
  N1771 --> N2665
  N2666[Class: UnifiedMonitoringService]:::cls
  N2665 --> N2666
  N2667[onModuleInit()]:::mth
  N2666 --> N2667
  N2668[onModuleDestroy()]:::mth
  N2666 --> N2668
  N2669[start()]:::mth
  N2666 --> N2669
  N2670[stop()]:::mth
  N2666 --> N2670
  N2671[getState()]:::mth
  N2666 --> N2671
  N2672[File: UserService.ts]:::file
  N1771 --> N2672
  N2673[Class: UserService]:::cls
  N2672 --> N2673
  N2674[createUser()]:::mth
  N2673 --> N2674
  N2675[getUserById()]:::mth
  N2673 --> N2675
  N2676[getUserByEmail()]:::mth
  N2673 --> N2676
  N2677[getUserByUsername()]:::mth
  N2673 --> N2677
  N2678[updateUser()]:::mth
  N2673 --> N2678
  N2679[File: UserTypeDetectionService.ts]:::file
  N1771 --> N2679
  N2680[Class: UserTypeDetectionService]:::cls
  N2679 --> N2680
  N2681[detectUserType()]:::mth
  N2680 --> N2681
  N2682[calculateRequestFrequency()]:::mth
  N2680 --> N2682
  N2683[calculateRequestVariability()]:::mth
  N2680 --> N2683
  N2684[calculateComplexity()]:::mth
  N2680 --> N2684
  N2685[File: agency.service.ts]:::file
  N1771 --> N2685
  N2686[Class: AgencyService]:::cls
  N2685 --> N2686
  N2687[createAgency()]:::mth
  N2686 --> N2687
  N2688[getAgency()]:::mth
  N2686 --> N2688
  N2689[getAgencyBySlug()]:::mth
  N2686 --> N2689
  N2690[updateAgency()]:::mth
  N2686 --> N2690
  N2691[deleteAgency()]:::mth
  N2686 --> N2691
  N2692[File: websocket.ts]:::file
  N1771 --> N2692
  N2693[Class: WebSocketService]:::cls
  N2692 --> N2693
  N2694[setupEventListeners()]:::mth
  N2693 --> N2694
  N2695[sendMessage()]:::mth
  N2693 --> N2695
  N2696[uploadFile()]:::mth
  N2693 --> N2696
  N2702[File: bridge.ts]:::file
  N1771 --> N2702
  N2703[Class: RedisBridge]:::cls
  N2702 --> N2703
  N2704[start()]:::mth
  N2703 --> N2704
  N2705[File: cascade_bridge.ts]:::file
  N1771 --> N2705
  N2706[Class: CascadeBridge]:::cls
  N2705 --> N2706
  N2707[start()]:::mth
  N2706 --> N2707
  N2708[handleCascadeMessage()]:::mth
  N2706 --> N2708
  N2718[File: code-scanner.ts]:::file
  N1771 --> N2718
  N2719[Class: CodeScanner]:::cls
  N2718 --> N2719
  N2720[scan()]:::mth
  N2719 --> N2720
  N2721[getLineNumber()]:::mth
  N2719 --> N2721
  N2722[File: rate-limiter.ts]:::file
  N1771 --> N2722
  N2723[Class: RateLimiter]:::cls
  N2722 --> N2723
  N2724[isRateLimited()]:::mth
  N2723 --> N2724
  N2725[File: security.module.ts]:::file
  N1771 --> N2725
  N2726[Class: SecurityModule]:::cls
  N2725 --> N2726
  N2728[File: enhanced-agency.service.ts]:::file
  N1771 --> N2728
  N2729[Class: EnhancedAgencyService]:::cls
  N2728 --> N2729
  N2730[createAgency()]:::mth
  N2729 --> N2730
  N2731[getAgencyDetails()]:::mth
  N2729 --> N2731
  N2732[updateAgency()]:::mth
  N2729 --> N2732
  N2733[deleteAgency()]:::mth
  N2729 --> N2733
  N2734[initializeSwarm()]:::mth
  N2729 --> N2734
  N2735[File: gemini-cli.adapter.ts]:::file
  N1771 --> N2735
  N2736[Class: GeminiCLIAdapter]:::cls
  N2735 --> N2736
  N2737[isAvailable()]:::mth
  N2736 --> N2737
  N2738[executeCommand()]:::mth
  N2736 --> N2738
  N2739[File: system-diagnostics.service.ts]:::file
  N1771 --> N2739
  N2740[Class: SystemDiagnosticsService]:::cls
  N2739 --> N2740
  N2741[runDiagnostics()]:::mth
  N2740 --> N2741
  N2742[getResolution()]:::mth
  N2740 --> N2742
  N2743[registerHealthCheck()]:::mth
  N2740 --> N2743
  N2744[executeChecks()]:::mth
  N2740 --> N2744
  N2745[getOverallStatus()]:::mth
  N2740 --> N2745
  N2747[File: bridge.service.ts]:::file
  N1771 --> N2747
  N2748[Class: BridgeService]:::cls
  N2747 --> N2748
  N2749[File: llm-config.service.ts]:::file
  N1771 --> N2749
  N2750[Class: LlmConfigService]:::cls
  N2749 --> N2750
  N2751[apiKey()]:::mth
  N2750 --> N2751
  N2752[model()]:::mth
  N2750 --> N2752
  N2753[apiEndpoint()]:::mth
  N2750 --> N2753
  N2754[File: llm.service.ts]:::file
  N1771 --> N2754
  N2755[Class: LlmService]:::cls
  N2754 --> N2755
  N2756[File: MessageProcessor.ts]:::file
  N1771 --> N2756
  N2757[Class: MessageProcessor]:::cls
  N2756 --> N2757
  N2758[processMessage()]:::mth
  N2757 --> N2758
  N2759[validateMessage()]:::mth
  N2757 --> N2759
  N2760[transformMessage()]:::mth
  N2757 --> N2760
  N2761[routeMessage()]:::mth
  N2757 --> N2761
  N2762[getProcessingStats()]:::mth
  N2757 --> N2762
  N2763[File: MessageQueue.ts]:::file
  N1771 --> N2763
  N2764[Class: MessageQueue]:::cls
  N2763 --> N2764
  N2765[enqueue()]:::mth
  N2764 --> N2765
  N2766[dequeue()]:::mth
  N2764 --> N2766
  N2767[peek()]:::mth
  N2764 --> N2767
  N2768[size()]:::mth
  N2764 --> N2768
  N2769[clear()]:::mth
  N2764 --> N2769
  N2770[File: SystemMonitor.ts]:::file
  N1771 --> N2770
  N2771[Class: SystemMonitor]:::cls
  N2770 --> N2771
  N2772[getSystemHealth()]:::mth
  N2771 --> N2772
  N2773[getSecurityAlerts()]:::mth
  N2771 --> N2773
  N2774[createAlert()]:::mth
  N2771 --> N2774
  N2775[File: multi-agent-chat-llm.service.ts]:::file
  N1771 --> N2775
  N2776[Class: MultiAgentChatLlmService]:::cls
  N2775 --> N2776
  N2777[File: onboarding-config.service.ts]:::file
  N1771 --> N2777
  N2778[Class: OnboardingConfigService]:::cls
  N2777 --> N2778
  N2779[File: workflow-orchestrator.service.ts]:::file
  N1771 --> N2779
  N2780[Class: WorkflowOrchestratorService]:::cls
  N2779 --> N2780
  N2781[File: prompt.service.ts]:::file
  N1771 --> N2781
  N2782[Class: PromptService]:::cls
  N2781 --> N2782
  N2783[File: protocol-translator.service.ts]:::file
  N1771 --> N2783
  N2784[Class: ProtocolTranslatorService]:::cls
  N2783 --> N2784
  N2785[File: rag-service.ts]:::file
  N1771 --> N2785
  N2786[Class: RagService]:::cls
  N2785 --> N2786
  N2787[query()]:::mth
  N2786 --> N2787
  N2789[File: service-category-router-clean.service.ts]:::file
  N1771 --> N2789
  N2790[Class: ServiceCategoryRouter]:::cls
  N2789 --> N2790
  N2791[registerCategory()]:::mth
  N2790 --> N2791
  N2792[route()]:::mth
  N2790 --> N2792
  N2793[getCategories()]:::mth
  N2790 --> N2793
  N2794[File: service-category-router.service.ts]:::file
  N1771 --> N2794
  N2795[Class: ServiceCategoryRouterService]:::cls
  N2794 --> N2795
  N2796[routeServiceRequest()]:::mth
  N2795 --> N2796
  N2797[File: state-manager.service.ts]:::file
  N1771 --> N2797
  N2798[Class: StateManagerService]:::cls
  N2797 --> N2798
  N2800[File: simple_client.ts]:::file
  N1771 --> N2800
  N2801[Class: SimpleWebSocketClient]:::cls
  N2800 --> N2801
  N2802[initialize()]:::mth
  N2801 --> N2802
  N2803[sendMessage()]:::mth
  N2801 --> N2803
  N2804[disconnect()]:::mth
  N2801 --> N2804
  N2808[File: StateManager.ts]:::file
  N1771 --> N2808
  N2809[Class: StateManager]:::cls
  N2808 --> N2809
  N2810[File: StateModule.ts]:::file
  N1771 --> N2810
  N2811[Class: StateModule]:::cls
  N2810 --> N2811
  N2812[File: StateService.ts]:::file
  N1771 --> N2812
  N2813[Class: StateService]:::cls
  N2812 --> N2813
  N2814[delete()]:::mth
  N2813 --> N2814
  N2815[exists()]:::mth
  N2813 --> N2815
  N2816[increment()]:::mth
  N2813 --> N2816
  N2817[decrement()]:::mth
  N2813 --> N2817
  N2818[getKeys()]:::mth
  N2813 --> N2818
  N2819[File: StateSynchronizer.ts]:::file
  N1771 --> N2819
  N2820[Class: StateSynchronizer]:::cls
  N2819 --> N2820
  N2821[updateState()]:::mth
  N2820 --> N2821
  N2822[getState()]:::mth
  N2820 --> N2822
  N2823[createSnapshot()]:::mth
  N2820 --> N2823
  N2824[restoreSnapshot()]:::mth
  N2820 --> N2824
  N2825[synchronize()]:::mth
  N2820 --> N2825
  N2826[File: SupabaseService.ts]:::file
  N1771 --> N2826
  N2827[Class: SupabaseService]:::cls
  N2826 --> N2827
  N2828[getClient()]:::mth
  N2827 --> N2828
  N2829[query()]:::mth
  N2827 --> N2829
  N2830[insert()]:::mth
  N2827 --> N2830
  N2831[update()]:::mth
  N2827 --> N2831
  N2832[delete()]:::mth
  N2827 --> N2832
  N2834[File: AgentInbox.ts]:::file
  N1771 --> N2834
  N2835[Class: AgentInbox]:::cls
  N2834 --> N2835
  N2836[getInboxKey()]:::mth
  N2835 --> N2836
  N2837[pushTask()]:::mth
  N2835 --> N2837
  N2838[pollTask()]:::mth
  N2835 --> N2838
  N2839[completeTask()]:::mth
  N2835 --> N2839
  N2840[File: SchedulerService.ts]:::file
  N1771 --> N2840
  N2841[Class: SchedulerService]:::cls
  N2840 --> N2841
  N2842[handleCron()]:::mth
  N2841 --> N2842
  N2843[File: TaskExecutor.ts]:::file
  N1771 --> N2843
  N2844[Class: TaskExecutor]:::cls
  N2843 --> N2844
  N2845[executeTask()]:::mth
  N2844 --> N2845
  N2846[File: TaskQueue.ts]:::file
  N1771 --> N2846
  N2847[Class: TaskQueue]:::cls
  N2846 --> N2847
  N2848[addTask()]:::mth
  N2847 --> N2848
  N2849[File: TaskScheduler.ts]:::file
  N1771 --> N2849
  N2850[Class: TaskScheduler]:::cls
  N2849 --> N2850
  N2851[handleCron()]:::mth
  N2850 --> N2851
  N2852[File: TaskService.ts]:::file
  N1771 --> N2852
  N2853[Class: TaskService]:::cls
  N2852 --> N2853
  N2854[createTask()]:::mth
  N2853 --> N2854
  N2855[getTask()]:::mth
  N2853 --> N2855
  N2856[updateTask()]:::mth
  N2853 --> N2856
  N2857[deleteTask()]:::mth
  N2853 --> N2857
  N2860[File: ComponentAnalysisSubscriber.ts]:::file
  N1771 --> N2860
  N2861[Class: ComponentAnalysisSubscriber]:::cls
  N2860 --> N2861
  N2862[notify()]:::mth
  N2861 --> N2862
  N2863[File: TaskActivityService.ts]:::file
  N1771 --> N2863
  N2864[Class: TaskActivityService]:::cls
  N2863 --> N2864
  N2865[logActivity()]:::mth
  N2864 --> N2865
  N2866[getTaskActivities()]:::mth
  N2864 --> N2866
  N2867[getAllActivities()]:::mth
  N2864 --> N2867
  N2868[getRecentActivities()]:::mth
  N2864 --> N2868
  N2870[File: task.module.ts]:::file
  N1771 --> N2870
  N2871[Class: TaskModule]:::cls
  N2870 --> N2871
  N2872[File: ComponentAnalysisTask.ts]:::file
  N1771 --> N2872
  N2873[Class: ComponentAnalysisTask]:::cls
  N2872 --> N2873
  N2874[execute()]:::mth
  N2873 --> N2874
  N2875[analyzeComplexity()]:::mth
  N2873 --> N2875
  N2876[analyzeMaintainability()]:::mth
  N2873 --> N2876
  N2877[analyzePerformance()]:::mth
  N2873 --> N2877
  N2878[generateIssues()]:::mth
  N2873 --> N2878
  N2881[File: AuthenticationService.ts]:::file
  N1771 --> N2881
  N2882[Class: AuthenticationService]:::cls
  N2881 --> N2882
  N2883[login()]:::mth
  N2882 --> N2883
  N2884[logout()]:::mth
  N2882 --> N2884
  N2885[validateSession()]:::mth
  N2882 --> N2885
  N2886[File: TokenManager.ts]:::file
  N1771 --> N2886
  N2887[Class: TokenManager]:::cls
  N2886 --> N2887
  N2888[generateToken()]:::mth
  N2887 --> N2888
  N2889[validateToken()]:::mth
  N2887 --> N2889
  N2890[revokeToken()]:::mth
  N2887 --> N2890
  N2891[refreshToken()]:::mth
  N2887 --> N2891
  N2892[revokeAllUserTokens()]:::mth
  N2887 --> N2892
  N2893[File: Agent.ts]:::file
  N1771 --> N2893
  N2894[Class: Agent]:::cls
  N2893 --> N2894
  N2895[File: Pipeline.ts]:::file
  N1771 --> N2895
  N2896[Class: Pipeline]:::cls
  N2895 --> N2896
  N2897[File: User.ts]:::file
  N1771 --> N2897
  N2898[Class: User]:::cls
  N2897 --> N2898
  N2899[File: TestDataGenerator.ts]:::file
  N1771 --> N2899
  N2900[Class: TestDataGenerator]:::cls
  N2899 --> N2900
  N2901[generate()]:::mth
  N2900 --> N2901
  N2902[generateMany()]:::mth
  N2900 --> N2902
  N2903[generateString()]:::mth
  N2900 --> N2903
  N2904[generateNumber()]:::mth
  N2900 --> N2904
  N2905[generateBoolean()]:::mth
  N2900 --> N2905
  N2907[File: AnthropicXmlTools.ts]:::file
  N1771 --> N2907
  N2908[Class: AnthropicXmlTools]:::cls
  N2907 --> N2908
  N2909[convertToolToXmlFormat()]:::mth
  N2908 --> N2909
  N2910[convertToolsToXmlFormat()]:::mth
  N2908 --> N2910
  N2911[parseXmlResponse()]:::mth
  N2908 --> N2911
  N2943[File: LoggingUtils.ts]:::file
  N1771 --> N2943
  N2944[Class: LoggingUtils]:::cls
  N2943 --> N2944
  N2945[initialize()]:::mth
  N2944 --> N2945
  N2946[writeLog()]:::mth
  N2944 --> N2946
  N2947[readLogs()]:::mth
  N2944 --> N2947
  N2948[clearLogs()]:::mth
  N2944 --> N2948
  N2949[File: correlation-id.ts]:::file
  N1771 --> N2949
  N2950[Class: CorrelationIdService]:::cls
  N2949 --> N2950
  N2951[generateCorrelationId()]:::mth
  N2950 --> N2951
  N2952[getCorrelationId()]:::mth
  N2950 --> N2952
  N2953[middleware()]:::mth
  N2950 --> N2953
  N2954[File: database.ts]:::file
  N1771 --> N2954
  N2955[Class: DatabaseError]:::cls
  N2954 --> N2955
  N2956[initialize()]:::mth
  N2955 --> N2956
  N2957[close()]:::mth
  N2955 --> N2957
  N2958[getMetrics()]:::mth
  N2955 --> N2958
  N2959[updateRedisMetrics()]:::mth
  N2955 --> N2959
  N2960[updateRedisLatency()]:::mth
  N2955 --> N2960
  N2961[Class: ConnectionError]:::cls
  N2954 --> N2961
  N2962[initialize()]:::mth
  N2961 --> N2962
  N2963[close()]:::mth
  N2961 --> N2963
  N2964[getMetrics()]:::mth
  N2961 --> N2964
  N2965[updateRedisMetrics()]:::mth
  N2961 --> N2965
  N2966[updateRedisLatency()]:::mth
  N2961 --> N2966
  N2967[Class: QueryError]:::cls
  N2954 --> N2967
  N2968[initialize()]:::mth
  N2967 --> N2968
  N2969[close()]:::mth
  N2967 --> N2969
  N2970[getMetrics()]:::mth
  N2967 --> N2970
  N2971[updateRedisMetrics()]:::mth
  N2967 --> N2971
  N2972[updateRedisLatency()]:::mth
  N2967 --> N2972
  N2973[Class: DatabaseService]:::cls
  N2954 --> N2973
  N2974[initialize()]:::mth
  N2973 --> N2974
  N2975[close()]:::mth
  N2973 --> N2975
  N2976[getMetrics()]:::mth
  N2973 --> N2976
  N2977[updateRedisMetrics()]:::mth
  N2973 --> N2977
  N2978[updateRedisLatency()]:::mth
  N2973 --> N2978
  N2979[File: encryption.ts]:::file
  N1771 --> N2979
  N2980[Class: EncryptionService]:::cls
  N2979 --> N2980
  N2981[encrypt()]:::mth
  N2980 --> N2981
  N2982[decrypt()]:::mth
  N2980 --> N2982
  N2983[hash()]:::mth
  N2980 --> N2983
  N2984[compareHash()]:::mth
  N2980 --> N2984
  N2986[File: errors.ts]:::file
  N1771 --> N2986
  N2987[Class: BaseError]:::cls
  N2986 --> N2987
  N2988[getSource()]:::mth
  N2987 --> N2988
  N2989[toSystemError()]:::mth
  N2987 --> N2989
  N2990[toJSON()]:::mth
  N2987 --> N2990
  N2991[getInstance()]:::mth
  N2987 --> N2991
  N2992[handle()]:::mth
  N2987 --> N2992
  N2993[Class: SystemInitializationError]:::cls
  N2986 --> N2993
  N2994[getSource()]:::mth
  N2993 --> N2994
  N2995[toSystemError()]:::mth
  N2993 --> N2995
  N2996[toJSON()]:::mth
  N2993 --> N2996
  N2997[getInstance()]:::mth
  N2993 --> N2997
  N2998[handle()]:::mth
  N2993 --> N2998
  N2999[Class: ServiceUnavailableError]:::cls
  N2986 --> N2999
  N3000[getSource()]:::mth
  N2999 --> N3000
  N3001[toSystemError()]:::mth
  N2999 --> N3001
  N3002[toJSON()]:::mth
  N2999 --> N3002
  N3003[getInstance()]:::mth
  N2999 --> N3003
  N3004[handle()]:::mth
  N2999 --> N3004
  N3005[Class: ConfigurationError]:::cls
  N2986 --> N3005
  N3006[getSource()]:::mth
  N3005 --> N3006
  N3007[toSystemError()]:::mth
  N3005 --> N3007
  N3008[toJSON()]:::mth
  N3005 --> N3008
  N3009[getInstance()]:::mth
  N3005 --> N3009
  N3010[handle()]:::mth
  N3005 --> N3010
  N3011[Class: AgentError]:::cls
  N2986 --> N3011
  N3012[getSource()]:::mth
  N3011 --> N3012
  N3013[toSystemError()]:::mth
  N3011 --> N3013
  N3014[toJSON()]:::mth
  N3011 --> N3014
  N3015[getInstance()]:::mth
  N3011 --> N3015
  N3016[handle()]:::mth
  N3011 --> N3016
  N3017[Class: AgentNotFoundError]:::cls
  N2986 --> N3017
  N3018[getSource()]:::mth
  N3017 --> N3018
  N3019[toSystemError()]:::mth
  N3017 --> N3019
  N3020[toJSON()]:::mth
  N3017 --> N3020
  N3021[getInstance()]:::mth
  N3017 --> N3021
  N3022[handle()]:::mth
  N3017 --> N3022
  N3023[Class: AgentTimeoutError]:::cls
  N2986 --> N3023
  N3024[getSource()]:::mth
  N3023 --> N3024
  N3025[toSystemError()]:::mth
  N3023 --> N3025
  N3026[toJSON()]:::mth
  N3023 --> N3026
  N3027[getInstance()]:::mth
  N3023 --> N3027
  N3028[handle()]:::mth
  N3023 --> N3028
  N3029[Class: TaskError]:::cls
  N2986 --> N3029
  N3030[getSource()]:::mth
  N3029 --> N3030
  N3031[toSystemError()]:::mth
  N3029 --> N3031
  N3032[toJSON()]:::mth
  N3029 --> N3032
  N3033[getInstance()]:::mth
  N3029 --> N3033
  N3034[handle()]:::mth
  N3029 --> N3034
  N3035[Class: TaskNotFoundError]:::cls
  N2986 --> N3035
  N3036[getSource()]:::mth
  N3035 --> N3036
  N3037[toSystemError()]:::mth
  N3035 --> N3037
  N3038[toJSON()]:::mth
  N3035 --> N3038
  N3039[getInstance()]:::mth
  N3035 --> N3039
  N3040[handle()]:::mth
  N3035 --> N3040
  N3041[Class: WorkflowError]:::cls
  N2986 --> N3041
  N3042[getSource()]:::mth
  N3041 --> N3042
  N3043[toSystemError()]:::mth
  N3041 --> N3043
  N3044[toJSON()]:::mth
  N3041 --> N3044
  N3045[getInstance()]:::mth
  N3041 --> N3045
  N3046[handle()]:::mth
  N3041 --> N3046
  N3047[Class: WorkflowNotFoundError]:::cls
  N2986 --> N3047
  N3048[getSource()]:::mth
  N3047 --> N3048
  N3049[toSystemError()]:::mth
  N3047 --> N3049
  N3050[toJSON()]:::mth
  N3047 --> N3050
  N3051[getInstance()]:::mth
  N3047 --> N3051
  N3052[handle()]:::mth
  N3047 --> N3052
  N3053[Class: MemoryError]:::cls
  N2986 --> N3053
  N3054[getSource()]:::mth
  N3053 --> N3054
  N3055[toSystemError()]:::mth
  N3053 --> N3055
  N3056[toJSON()]:::mth
  N3053 --> N3056
  N3057[getInstance()]:::mth
  N3053 --> N3057
  N3058[handle()]:::mth
  N3053 --> N3058
  N3059[Class: DatabaseError]:::cls
  N2986 --> N3059
  N3060[getSource()]:::mth
  N3059 --> N3060
  N3061[toSystemError()]:::mth
  N3059 --> N3061
  N3062[toJSON()]:::mth
  N3059 --> N3062
  N3063[getInstance()]:::mth
  N3059 --> N3063
  N3064[handle()]:::mth
  N3059 --> N3064
  N3065[Class: ValidationError]:::cls
  N2986 --> N3065
  N3066[getSource()]:::mth
  N3065 --> N3066
  N3067[toSystemError()]:::mth
  N3065 --> N3067
  N3068[toJSON()]:::mth
  N3065 --> N3068
  N3069[getInstance()]:::mth
  N3065 --> N3069
  N3070[handle()]:::mth
  N3065 --> N3070
  N3071[Class: NetworkError]:::cls
  N2986 --> N3071
  N3072[getSource()]:::mth
  N3071 --> N3072
  N3073[toSystemError()]:::mth
  N3071 --> N3073
  N3074[toJSON()]:::mth
  N3071 --> N3074
  N3075[getInstance()]:::mth
  N3071 --> N3075
  N3076[handle()]:::mth
  N3071 --> N3076
  N3077[Class: TimeoutError]:::cls
  N2986 --> N3077
  N3078[getSource()]:::mth
  N3077 --> N3078
  N3079[toSystemError()]:::mth
  N3077 --> N3079
  N3080[toJSON()]:::mth
  N3077 --> N3080
  N3081[getInstance()]:::mth
  N3077 --> N3081
  N3082[handle()]:::mth
  N3077 --> N3082
  N3083[Class: SecurityError]:::cls
  N2986 --> N3083
  N3084[getSource()]:::mth
  N3083 --> N3084
  N3085[toSystemError()]:::mth
  N3083 --> N3085
  N3086[toJSON()]:::mth
  N3083 --> N3086
  N3087[getInstance()]:::mth
  N3083 --> N3087
  N3088[handle()]:::mth
  N3083 --> N3088
  N3089[Class: ErrorHandler]:::cls
  N2986 --> N3089
  N3090[getSource()]:::mth
  N3089 --> N3090
  N3091[toSystemError()]:::mth
  N3089 --> N3091
  N3092[toJSON()]:::mth
  N3089 --> N3092
  N3093[getInstance()]:::mth
  N3089 --> N3093
  N3094[handle()]:::mth
  N3089 --> N3094
  N3095[File: logger.ts]:::file
  N1771 --> N3095
  N3096[Class: Logger]:::cls
  N3095 --> N3096
  N3097[getLogLevelFromEnv()]:::mth
  N3096 --> N3097
  N3098[formatMessage()]:::mth
  N3096 --> N3098
  N3099[shouldLog()]:::mth
  N3096 --> N3099
  N3100[error()]:::mth
  N3096 --> N3100
  N3101[warn()]:::mth
  N3096 --> N3101
  N3104[File: embedding-service.ts]:::file
  N1771 --> N3104
  N3105[Class: EmbeddingService]:::cls
  N3104 --> N3105
  N3106[generateEmbedding()]:::mth
  N3105 --> N3106
  N3107[callEmbeddingAPI()]:::mth
  N3105 --> N3107
  N3108[File: provider-registry.ts]:::file
  N1771 --> N3108
  N3109[Class: PineconeProvider]:::cls
  N3108 --> N3109
  N3110[storeVectors()]:::mth
  N3109 --> N3110
  N3111[search()]:::mth
  N3109 --> N3111
  N3112[deleteVectors()]:::mth
  N3109 --> N3112
  N3113[clearNamespace()]:::mth
  N3109 --> N3113
  N3114[storeVectors()]:::mth
  N3109 --> N3114
  N3115[Class: ChromaProvider]:::cls
  N3108 --> N3115
  N3116[storeVectors()]:::mth
  N3115 --> N3116
  N3117[search()]:::mth
  N3115 --> N3117
  N3118[deleteVectors()]:::mth
  N3115 --> N3118
  N3119[clearNamespace()]:::mth
  N3115 --> N3119
  N3120[storeVectors()]:::mth
  N3115 --> N3120
  N3121[Class: RedisProvider]:::cls
  N3108 --> N3121
  N3122[storeVectors()]:::mth
  N3121 --> N3122
  N3123[search()]:::mth
  N3121 --> N3123
  N3124[deleteVectors()]:::mth
  N3121 --> N3124
  N3125[clearNamespace()]:::mth
  N3121 --> N3125
  N3126[storeVectors()]:::mth
  N3121 --> N3126
  N3127[Class: ProviderRegistry]:::cls
  N3108 --> N3127
  N3128[storeVectors()]:::mth
  N3127 --> N3128
  N3129[search()]:::mth
  N3127 --> N3129
  N3130[deleteVectors()]:::mth
  N3127 --> N3130
  N3131[clearNamespace()]:::mth
  N3127 --> N3131
  N3132[storeVectors()]:::mth
  N3127 --> N3132
  N3133[File: pinecone-provider.ts]:::file
  N1771 --> N3133
  N3134[Class: PineconeProvider]:::cls
  N3133 --> N3134
  N3135[storeVectors()]:::mth
  N3134 --> N3135
  N3136[search()]:::mth
  N3134 --> N3136
  N3137[deleteVectors()]:::mth
  N3134 --> N3137
  N3138[clearNamespace()]:::mth
  N3134 --> N3138
  N3139[performSearch()]:::mth
  N3134 --> N3139
  N3141[File: vector-store.ts]:::file
  N1771 --> N3141
  N3142[Class: VectorStore]:::cls
  N3141 --> N3142
  N3143[search()]:::mth
  N3142 --> N3143
  N3144[addDocuments()]:::mth
  N3142 --> N3144
  N3145[deleteDocuments()]:::mth
  N3142 --> N3145
  N3146[File: verification_backup.ts]:::file
  N1771 --> N3146
  N3147[Class: VerificationService]:::cls
  N3146 --> N3147
  N3148[verifyOutput()]:::mth
  N3147 --> N3148
  N3149[verifySchema()]:::mth
  N3147 --> N3149
  N3150[verifyContent()]:::mth
  N3147 --> N3150
  N3151[verifySecurity()]:::mth
  N3147 --> N3151
  N3152[verifyHarmlessness()]:::mth
  N3147 --> N3152
  N3153[File: verification_clean.ts]:::file
  N1771 --> N3153
  N3154[Class: VerificationService]:::cls
  N3153 --> N3154
  N3155[verifyOutput()]:::mth
  N3154 --> N3155
  N3156[verifySchema()]:::mth
  N3154 --> N3156
  N3157[verifyContent()]:::mth
  N3154 --> N3157
  N3158[verifySecurity()]:::mth
  N3154 --> N3158
  N3159[verifyHarmlessness()]:::mth
  N3154 --> N3159
  N3160[File: metadataVersioning_clean.ts]:::file
  N1771 --> N3160
  N3161[Class: MetadataVersioning]:::cls
  N3160 --> N3161
  N3162[createVersion()]:::mth
  N3161 --> N3162
  N3163[getVersion()]:::mth
  N3161 --> N3163
  N3164[getLatestVersion()]:::mth
  N3161 --> N3164
  N3165[getAllVersions()]:::mth
  N3161 --> N3165
  N3166[compareVersions()]:::mth
  N3161 --> N3166
  N3168[File: VisualizationManager.ts]:::file
  N1771 --> N3168
  N3169[Class: VisualizationManager]:::cls
  N3168 --> N3169
  N3170[createVisualization()]:::mth
  N3169 --> N3170
  N3171[getVisualization()]:::mth
  N3169 --> N3171
  N3172[exportVisualization()]:::mth
  N3169 --> N3172
  N3173[clearCache()]:::mth
  N3169 --> N3173
  N3174[getCacheStats()]:::mth
  N3169 --> N3174
  N3175[File: VisualizationManager_clean.ts]:::file
  N1771 --> N3175
  N3176[Class: VisualizationManager]:::cls
  N3175 --> N3176
  N3177[createVisualization()]:::mth
  N3176 --> N3177
  N3178[getVisualization()]:::mth
  N3176 --> N3178
  N3179[updateVisualization()]:::mth
  N3176 --> N3179
  N3180[deleteVisualization()]:::mth
  N3176 --> N3180
  N3181[getAllVisualizations()]:::mth
  N3176 --> N3181
  N3182[File: fileVisualizer.ts]:::file
  N1771 --> N3182
  N3183[Class: FileVisualizer]:::cls
  N3182 --> N3183
  N3184[generateFileTree()]:::mth
  N3183 --> N3184
  N3185[generateDependencyGraph()]:::mth
  N3183 --> N3185
  N3186[generateCodeMetrics()]:::mth
  N3183 --> N3186
  N3187[exportVisualization()]:::mth
  N3183 --> N3187
  N3188[getDirectoryChildren()]:::mth
  N3183 --> N3188
  N3189[File: fileVisualizer_clean.ts]:::file
  N1771 --> N3189
  N3190[Class: FileVisualizer]:::cls
  N3189 --> N3190
  N3191[visualizeDirectory()]:::mth
  N3190 --> N3191
  N3192[generateTree()]:::mth
  N3190 --> N3192
  N3193[analyzeFileStructure()]:::mth
  N3190 --> N3193
  N3197[File: webhook-manager.service.ts]:::file
  N1771 --> N3197
  N3198[Class: WebhookManagerService]:::cls
  N3197 --> N3198
  N3199[registerWebhook()]:::mth
  N3198 --> N3199
  N3200[unregisterWebhook()]:::mth
  N3198 --> N3200
  N3201[updateWebhook()]:::mth
  N3198 --> N3201
  N3202[getWebhook()]:::mth
  N3198 --> N3202
  N3203[getAllWebhooks()]:::mth
  N3198 --> N3203
  N3204[File: webhooks.controller.ts]:::file
  N1771 --> N3204
  N3205[Class: WebhooksController]:::cls
  N3204 --> N3205
  N3206[getAllWebhooks()]:::mth
  N3205 --> N3206
  N3207[retryFailedWebhooks()]:::mth
  N3205 --> N3207
  N3209[File: WebSocketManager.ts]:::file
  N1771 --> N3209
  N3210[Class: WebSocketManager]:::cls
  N3209 --> N3210
  N3211[onModuleInit()]:::mth
  N3210 --> N3211
  N3212[onModuleDestroy()]:::mth
  N3210 --> N3212
  N3213[handleConnection()]:::mth
  N3210 --> N3213
  N3214[handleDisconnection()]:::mth
  N3210 --> N3214
  N3215[handleError()]:::mth
  N3210 --> N3215
  N3216[File: ai-coder.gateway.ts]:::file
  N1771 --> N3216
  N3217[Class: AiCoderGateway]:::cls
  N3216 --> N3217
  N3218[handleConnection()]:::mth
  N3217 --> N3218
  N3219[handleDisconnect()]:::mth
  N3217 --> N3219
  N3220[File: websocket.service.ts]:::file
  N1771 --> N3220
  N3221[Class: WebSocketService]:::cls
  N3220 --> N3221
  N3222[handleConnection()]:::mth
  N3221 --> N3222
  N3223[handleDisconnection()]:::mth
  N3221 --> N3223
  N3224[sendMessage()]:::mth
  N3221 --> N3224
  N3225[handleMessage()]:::mth
  N3221 --> N3225
  N3226[broadcastMessage()]:::mth
  N3221 --> N3226
  N3228[File: wizard.ts]:::file
  N1771 --> N3228
  N3229[Class: ProjectWizard]:::cls
  N3228 --> N3229
  N3230[getTool()]:::mth
  N3229 --> N3230
  N3231[analyzeProject()]:::mth
  N3229 --> N3231
  N3232[File: wizard_session.ts]:::file
  N1771 --> N3232
  N3233[Class: WizardSession]:::cls
  N3232 --> N3233
  N3234[analyzeVideoContent()]:::mth
  N3233 --> N3234
  N3235[File: WorkflowEngine.ts]:::file
  N1771 --> N3235
  N3236[Class: WorkflowEngine]:::cls
  N3235 --> N3236
  N3237[start()]:::mth
  N3236 --> N3237
  N3238[stop()]:::mth
  N3236 --> N3238
  N3239[getState()]:::mth
  N3236 --> N3239
  N3240[generateSecureId()]:::mth
  N3236 --> N3240
  N3241[registerWorkflow()]:::mth
  N3236 --> N3241
  N3242[File: WorkflowExecutor.ts]:::file
  N1771 --> N3242
  N3243[Class: WorkflowExecutor]:::cls
  N3242 --> N3243
  N3244[canExecute()]:::mth
  N3243 --> N3244
  N3245[start()]:::mth
  N3243 --> N3245
  N3246[stop()]:::mth
  N3243 --> N3246
  N3247[getState()]:::mth
  N3243 --> N3247
  N3248[executeStep()]:::mth
  N3243 --> N3248
  N3249[Class: TaskStepExecutor]:::cls
  N3242 --> N3249
  N3250[canExecute()]:::mth
  N3249 --> N3250
  N3251[start()]:::mth
  N3249 --> N3251
  N3252[stop()]:::mth
  N3249 --> N3252
  N3253[getState()]:::mth
  N3249 --> N3253
  N3254[executeStep()]:::mth
  N3249 --> N3254
  N3255[Class: DecisionStepExecutor]:::cls
  N3242 --> N3255
  N3256[canExecute()]:::mth
  N3255 --> N3256
  N3257[start()]:::mth
  N3255 --> N3257
  N3258[stop()]:::mth
  N3255 --> N3258
  N3259[getState()]:::mth
  N3255 --> N3259
  N3260[executeStep()]:::mth
  N3255 --> N3260
  N3261[Class: WaitStepExecutor]:::cls
  N3242 --> N3261
  N3262[canExecute()]:::mth
  N3261 --> N3262
  N3263[start()]:::mth
  N3261 --> N3263
  N3264[stop()]:::mth
  N3261 --> N3264
  N3265[getState()]:::mth
  N3261 --> N3265
  N3266[executeStep()]:::mth
  N3261 --> N3266
  N3267[Class: ScriptStepExecutor]:::cls
  N3242 --> N3267
  N3268[canExecute()]:::mth
  N3267 --> N3268
  N3269[start()]:::mth
  N3267 --> N3269
  N3270[stop()]:::mth
  N3267 --> N3270
  N3271[getState()]:::mth
  N3267 --> N3271
  N3272[executeStep()]:::mth
  N3267 --> N3272
  N3273[Class: ParallelStepExecutor]:::cls
  N3242 --> N3273
  N3274[canExecute()]:::mth
  N3273 --> N3274
  N3275[start()]:::mth
  N3273 --> N3275
  N3276[stop()]:::mth
  N3273 --> N3276
  N3277[getState()]:::mth
  N3273 --> N3277
  N3278[executeStep()]:::mth
  N3273 --> N3278
  N3280[File: analytics.ts]:::file
  N1771 --> N3280
  N3281[Class: MetricsCollector]:::cls
  N3280 --> N3281
  N3282[collect()]:::mth
  N3281 --> N3282
  N3283[generateInsights()]:::mth
  N3281 --> N3283
  N3284[generateBusinessInsights()]:::mth
  N3281 --> N3284
  N3285[generateDashboard()]:::mth
  N3281 --> N3285
  N3286[analyzeTrends()]:::mth
  N3281 --> N3286
  N3287[Class: InsightGenerator]:::cls
  N3280 --> N3287
  N3288[collect()]:::mth
  N3287 --> N3288
  N3289[generateInsights()]:::mth
  N3287 --> N3289
  N3290[generateBusinessInsights()]:::mth
  N3287 --> N3290
  N3291[generateDashboard()]:::mth
  N3287 --> N3291
  N3292[analyzeTrends()]:::mth
  N3287 --> N3292
  N3293[Class: WorkflowAnalytics]:::cls
  N3280 --> N3293
  N3294[collect()]:::mth
  N3293 --> N3294
  N3295[generateInsights()]:::mth
  N3293 --> N3295
  N3296[generateBusinessInsights()]:::mth
  N3293 --> N3296
  N3297[generateDashboard()]:::mth
  N3293 --> N3297
  N3298[analyzeTrends()]:::mth
  N3293 --> N3298
  N3299[File: audit.ts]:::file
  N1771 --> N3299
  N3300[Class: AuditLogger]:::cls
  N3299 --> N3300
  N3301[log()]:::mth
  N3300 --> N3301
  N3302[getEvents()]:::mth
  N3300 --> N3302
  N3303[analyzeEvents()]:::mth
  N3300 --> N3303
  N3304[recordAuditEvent()]:::mth
  N3300 --> N3304
  N3305[generateComplianceReport()]:::mth
  N3300 --> N3305
  N3306[Class: ComplianceRuleEngine]:::cls
  N3299 --> N3306
  N3307[log()]:::mth
  N3306 --> N3307
  N3308[getEvents()]:::mth
  N3306 --> N3308
  N3309[analyzeEvents()]:::mth
  N3306 --> N3309
  N3310[recordAuditEvent()]:::mth
  N3306 --> N3310
  N3311[generateComplianceReport()]:::mth
  N3306 --> N3311
  N3312[Class: WorkflowAuditSystem]:::cls
  N3299 --> N3312
  N3313[log()]:::mth
  N3312 --> N3313
  N3314[getEvents()]:::mth
  N3312 --> N3314
  N3315[analyzeEvents()]:::mth
  N3312 --> N3315
  N3316[recordAuditEvent()]:::mth
  N3312 --> N3316
  N3317[generateComplianceReport()]:::mth
  N3312 --> N3317
  N3318[File: concurrency.ts]:::file
  N1771 --> N3318
  N3319[Class: ConcurrencyManager]:::cls
  N3318 --> N3319
  N3320[canExecute()]:::mth
  N3319 --> N3320
  N3321[startExecution()]:::mth
  N3319 --> N3321
  N3322[endExecution()]:::mth
  N3319 --> N3322
  N3323[getActiveExecutions()]:::mth
  N3319 --> N3323
  N3324[createExecutionContext()]:::mth
  N3319 --> N3324
  N3325[Class: ConcurrentExecutionError]:::cls
  N3318 --> N3325
  N3326[canExecute()]:::mth
  N3325 --> N3326
  N3327[startExecution()]:::mth
  N3325 --> N3327
  N3328[endExecution()]:::mth
  N3325 --> N3328
  N3329[getActiveExecutions()]:::mth
  N3325 --> N3329
  N3330[createExecutionContext()]:::mth
  N3325 --> N3330
  N3331[File: debugger.ts]:::file
  N1771 --> N3331
  N3332[Class: DebugSession]:::cls
  N3331 --> N3332
  N3333[triggerBreakpoint()]:::mth
  N3332 --> N3333
  N3334[getId()]:::mth
  N3332 --> N3334
  N3335[recordStepExecution()]:::mth
  N3332 --> N3335
  N3336[debugWorkflow()]:::mth
  N3332 --> N3336
  N3337[getDebugState()]:::mth
  N3332 --> N3337
  N3338[Class: StepTracer]:::cls
  N3331 --> N3338
  N3339[triggerBreakpoint()]:::mth
  N3338 --> N3339
  N3340[getId()]:::mth
  N3338 --> N3340
  N3341[recordStepExecution()]:::mth
  N3338 --> N3341
  N3342[debugWorkflow()]:::mth
  N3338 --> N3342
  N3343[getDebugState()]:::mth
  N3338 --> N3343
  N3344[Class: WorkflowDebugger]:::cls
  N3331 --> N3344
  N3345[triggerBreakpoint()]:::mth
  N3344 --> N3345
  N3346[getId()]:::mth
  N3344 --> N3346
  N3347[recordStepExecution()]:::mth
  N3344 --> N3347
  N3348[debugWorkflow()]:::mth
  N3344 --> N3348
  N3349[getDebugState()]:::mth
  N3344 --> N3349
  N3350[File: errorRecovery.ts]:::file
  N1771 --> N3350
  N3351[Class: ErrorRecoveryManager]:::cls
  N3350 --> N3351
  N3352[recover()]:::mth
  N3351 --> N3352
  N3353[determineRecoveryStrategy()]:::mth
  N3351 --> N3353
  N3354[retryStep()]:::mth
  N3351 --> N3354
  N3355[rollbackToCheckpoint()]:::mth
  N3351 --> N3355
  N3356[compensateTransaction()]:::mth
  N3351 --> N3356
  N3357[File: gateway.ts]:::file
  N1771 --> N3357
  N3358[Class: WorkflowGateway]:::cls
  N3357 --> N3358
  N3359[validateAPISpec()]:::mth
  N3358 --> N3359
  N3360[createIntegration()]:::mth
  N3358 --> N3360
  N3361[registerIntegration()]:::mth
  N3358 --> N3361
  N3362[registerExternalService()]:::mth
  N3358 --> N3362
  N3363[makeAPICall()]:::mth
  N3358 --> N3363
  N3365[File: api-node.ts]:::file
  N1771 --> N3365
  N3366[Class: APINode]:::cls
  N3365 --> N3366
  N3367[execute()]:::mth
  N3366 --> N3367
  N3368[fetch()]:::mth
  N3366 --> N3368
  N3369[File: condition-node.ts]:::file
  N1771 --> N3369
  N3370[Class: ConditionNode]:::cls
  N3369 --> N3370
  N3371[execute()]:::mth
  N3370 --> N3371
  N3372[evaluateCondition()]:::mth
  N3370 --> N3372
  N3373[File: llm-node.ts]:::file
  N1771 --> N3373
  N3374[Class: LLMNodeHandler]:::cls
  N3373 --> N3374
  N3375[handle()]:::mth
  N3374 --> N3375
  N3376[File: notification-node.ts]:::file
  N1771 --> N3376
  N3377[Class: NotificationNodeHandler]:::cls
  N3376 --> N3377
  N3378[handle()]:::mth
  N3377 --> N3378
  N3379[File: recovery.ts]:::file
  N1771 --> N3379
  N3380[Class: WorkflowRecoverySystem]:::cls
  N3379 --> N3380
  N3381[findBackup()]:::mth
  N3380 --> N3381
  N3382[executeRecovery()]:::mth
  N3380 --> N3382
  N3383[createWorkflowBackup()]:::mth
  N3380 --> N3383
  N3384[recoverWorkflow()]:::mth
  N3380 --> N3384
  N3385[generateChecksum()]:::mth
  N3380 --> N3385
  N3386[File: resources.ts]:::file
  N1771 --> N3386
  N3387[Class: WorkflowResourceManager]:::cls
  N3386 --> N3387
  N3388[scale()]:::mth
  N3387 --> N3388
  N3389[getCurrentLoad()]:::mth
  N3387 --> N3389
  N3390[allocateResources()]:::mth
  N3387 --> N3390
  N3391[getResourceMetrics()]:::mth
  N3387 --> N3391
  N3392[calculateResourceRequirements()]:::mth
  N3387 --> N3392
  N3393[File: security.ts]:::file
  N1771 --> N3393
  N3394[Class: WorkflowSecurityManager]:::cls
  N3393 --> N3394
  N3395[getUserPermissions()]:::mth
  N3394 --> N3395
  N3396[encrypt()]:::mth
  N3394 --> N3396
  N3397[generateToken()]:::mth
  N3394 --> N3397
  N3398[authorizeWorkflowAccess()]:::mth
  N3394 --> N3398
  N3399[encryptWorkflow()]:::mth
  N3394 --> N3399
  N3400[File: testing.ts]:::file
  N1771 --> N3400
  N3401[Class: WorkflowTestFramework]:::cls
  N3400 --> N3401
  N3402[run()]:::mth
  N3401 --> N3402
  N3403[register()]:::mth
  N3401 --> N3403
  N3404[generate()]:::mth
  N3401 --> N3404
  N3405[testWorkflow()]:::mth
  N3401 --> N3405
  N3406[generateTestCases()]:::mth
  N3401 --> N3406
  N3407[File: index.ts]:::file
  N1771 --> N3407
  N3408[Class: export]:::cls
  N3407 --> N3408
  N3409[Class: WorkflowError]:::cls
  N3407 --> N3409
  N3411[File: validator.ts]:::file
  N1771 --> N3411
  N3412[Class: WorkflowValidator]:::cls
  N3411 --> N3412
  N3413[validateTemplate()]:::mth
  N3412 --> N3413
  N3414[validateStep()]:::mth
  N3412 --> N3414
  N3415[validateDependencies()]:::mth
  N3412 --> N3415
  N3416[File: versioning.ts]:::file
  N1771 --> N3416
  N3417[Class: WorkflowVersionManager]:::cls
  N3416 --> N3417
  N3418[migrate()]:::mth
  N3417 --> N3418
  N3419[migrateWorkflow()]:::mth
  N3417 --> N3419
  N3420[calculateMigrationPath()]:::mth
  N3417 --> N3420
  N3421[applyMigration()]:::mth
  N3417 --> N3421
  N3422[registerMigrations()]:::mth
  N3417 --> N3422
  N3423[File: workflow-executor.ts]:::file
  N1771 --> N3423
  N3424[Class: WorkflowExecutor]:::cls
  N3423 --> N3424
  N3425[execute()]:::mth
  N3424 --> N3425
  N3426[executeStep()]:::mth
  N3424 --> N3426
  N3427[validateWorkflow()]:::mth
  N3424 --> N3427
  N3428[File: workflow.module.ts]:::file
  N1771 --> N3428
  N3429[Class: WorkflowModule]:::cls
  N3428 --> N3429
  N3430[core-auth]:::pkg
  TNF --> N3430
  N3431[core-error-handling]:::pkg
  TNF --> N3431
  N3432[File: BaseErrorHandler.ts]:::file
  N3431 --> N3432
  N3433[Class: BaseErrorHandler]:::cls
  N3432 --> N3433
  N3434[handleError()]:::mth
  N3433 --> N3434
  N3435[registerRecoveryStrategy()]:::mth
  N3433 --> N3435
  N3436[registerErrorHandler()]:::mth
  N3433 --> N3436
  N3437[getStatistics()]:::mth
  N3433 --> N3437
  N3438[getErrorHistory()]:::mth
  N3433 --> N3438
  N3439[File: CustomErrors.ts]:::file
  N3431 --> N3439
  N3440[Class: ApplicationError]:::cls
  N3439 --> N3440
  N3441[toJSON()]:::mth
  N3440 --> N3441
  N3442[Class: NetworkError]:::cls
  N3439 --> N3442
  N3443[toJSON()]:::mth
  N3442 --> N3443
  N3444[Class: TimeoutError]:::cls
  N3439 --> N3444
  N3445[toJSON()]:::mth
  N3444 --> N3445
  N3446[Class: ConnectionError]:::cls
  N3439 --> N3446
  N3447[toJSON()]:::mth
  N3446 --> N3447
  N3448[Class: HttpError]:::cls
  N3439 --> N3448
  N3449[toJSON()]:::mth
  N3448 --> N3449
  N3450[Class: AuthenticationError]:::cls
  N3439 --> N3450
  N3451[toJSON()]:::mth
  N3450 --> N3451
  N3452[Class: TokenExpiredError]:::cls
  N3439 --> N3452
  N3453[toJSON()]:::mth
  N3452 --> N3453
  N3454[Class: InvalidCredentialsError]:::cls
  N3439 --> N3454
  N3455[toJSON()]:::mth
  N3454 --> N3455
  N3456[Class: AuthorizationError]:::cls
  N3439 --> N3456
  N3457[toJSON()]:::mth
  N3456 --> N3457
  N3458[Class: InsufficientPermissionsError]:::cls
  N3439 --> N3458
  N3459[toJSON()]:::mth
  N3458 --> N3459
  N3460[Class: ValidationError]:::cls
  N3439 --> N3460
  N3461[toJSON()]:::mth
  N3460 --> N3461
  N3462[Class: RequiredFieldError]:::cls
  N3439 --> N3462
  N3463[toJSON()]:::mth
  N3462 --> N3463
  N3464[Class: InvalidFormatError]:::cls
  N3439 --> N3464
  N3465[toJSON()]:::mth
  N3464 --> N3465
  N3466[Class: OutOfRangeError]:::cls
  N3439 --> N3466
  N3467[toJSON()]:::mth
  N3466 --> N3467
  N3468[Class: BusinessError]:::cls
  N3439 --> N3468
  N3469[toJSON()]:::mth
  N3468 --> N3469
  N3470[Class: NotFoundError]:::cls
  N3439 --> N3470
  N3471[toJSON()]:::mth
  N3470 --> N3471
  N3472[Class: ConflictError]:::cls
  N3439 --> N3472
  N3473[toJSON()]:::mth
  N3472 --> N3473
  N3474[Class: DuplicateResourceError]:::cls
  N3439 --> N3474
  N3475[toJSON()]:::mth
  N3474 --> N3475
  N3476[Class: OperationNotAllowedError]:::cls
  N3439 --> N3476
  N3477[toJSON()]:::mth
  N3476 --> N3477
  N3478[Class: RateLimitError]:::cls
  N3439 --> N3478
  N3479[toJSON()]:::mth
  N3478 --> N3479
  N3480[Class: SystemError]:::cls
  N3439 --> N3480
  N3481[toJSON()]:::mth
  N3480 --> N3481
  N3482[Class: DatabaseError]:::cls
  N3439 --> N3482
  N3483[toJSON()]:::mth
  N3482 --> N3483
  N3484[Class: ConfigurationError]:::cls
  N3439 --> N3484
  N3485[toJSON()]:::mth
  N3484 --> N3485
  N3486[Class: ServiceUnavailableError]:::cls
  N3439 --> N3486
  N3487[toJSON()]:::mth
  N3486 --> N3487
  N3488[Class: ExternalServiceError]:::cls
  N3439 --> N3488
  N3489[toJSON()]:::mth
  N3488 --> N3489
  N3490[Class: FileSystemError]:::cls
  N3439 --> N3490
  N3491[toJSON()]:::mth
  N3490 --> N3491
  N3492[Class: IntegrationError]:::cls
  N3439 --> N3492
  N3493[toJSON()]:::mth
  N3492 --> N3493
  N3494[Class: ApiIntegrationError]:::cls
  N3439 --> N3494
  N3495[toJSON()]:::mth
  N3494 --> N3495
  N3496[Class: PaymentError]:::cls
  N3439 --> N3496
  N3497[toJSON()]:::mth
  N3496 --> N3497
  N3498[Class: PaymentDeclinedError]:::cls
  N3439 --> N3498
  N3499[toJSON()]:::mth
  N3498 --> N3499
  N3500[Class: InsufficientFundsError]:::cls
  N3439 --> N3500
  N3501[toJSON()]:::mth
  N3500 --> N3501
  N3504[File: RecoveryStrategies.ts]:::file
  N3431 --> N3504
  N3505[Class: NetworkReconnectionStrategy]:::cls
  N3504 --> N3505
  N3506[recover()]:::mth
  N3505 --> N3506
  N3507[waitForOnline()]:::mth
  N3505 --> N3507
  N3508[recover()]:::mth
  N3505 --> N3508
  N3509[recover()]:::mth
  N3505 --> N3509
  N3510[recover()]:::mth
  N3505 --> N3510
  N3511[Class: TokenRefreshStrategy]:::cls
  N3504 --> N3511
  N3512[recover()]:::mth
  N3511 --> N3512
  N3513[waitForOnline()]:::mth
  N3511 --> N3513
  N3514[recover()]:::mth
  N3511 --> N3514
  N3515[recover()]:::mth
  N3511 --> N3515
  N3516[recover()]:::mth
  N3511 --> N3516
  N3517[Class: CacheFallbackStrategy]:::cls
  N3504 --> N3517
  N3518[recover()]:::mth
  N3517 --> N3518
  N3519[waitForOnline()]:::mth
  N3517 --> N3519
  N3520[recover()]:::mth
  N3517 --> N3520
  N3521[recover()]:::mth
  N3517 --> N3521
  N3522[recover()]:::mth
  N3517 --> N3522
  N3523[Class: ServiceFailoverStrategy]:::cls
  N3504 --> N3523
  N3524[recover()]:::mth
  N3523 --> N3524
  N3525[waitForOnline()]:::mth
  N3523 --> N3525
  N3526[recover()]:::mth
  N3523 --> N3526
  N3527[recover()]:::mth
  N3523 --> N3527
  N3528[recover()]:::mth
  N3523 --> N3528
  N3529[Class: DataSanitizationStrategy]:::cls
  N3504 --> N3529
  N3530[recover()]:::mth
  N3529 --> N3530
  N3531[waitForOnline()]:::mth
  N3529 --> N3531
  N3532[recover()]:::mth
  N3529 --> N3532
  N3533[recover()]:::mth
  N3529 --> N3533
  N3534[recover()]:::mth
  N3529 --> N3534
  N3535[Class: GracefulDegradationStrategy]:::cls
  N3504 --> N3535
  N3536[recover()]:::mth
  N3535 --> N3536
  N3537[waitForOnline()]:::mth
  N3535 --> N3537
  N3538[recover()]:::mth
  N3535 --> N3538
  N3539[recover()]:::mth
  N3535 --> N3539
  N3540[recover()]:::mth
  N3535 --> N3540
  N3541[Class: RateLimitBackoffStrategy]:::cls
  N3504 --> N3541
  N3542[recover()]:::mth
  N3541 --> N3542
  N3543[waitForOnline()]:::mth
  N3541 --> N3543
  N3544[recover()]:::mth
  N3541 --> N3544
  N3545[recover()]:::mth
  N3541 --> N3545
  N3546[recover()]:::mth
  N3541 --> N3546
  N3547[Class: DatabaseRollbackStrategy]:::cls
  N3504 --> N3547
  N3548[recover()]:::mth
  N3547 --> N3548
  N3549[waitForOnline()]:::mth
  N3547 --> N3549
  N3550[recover()]:::mth
  N3547 --> N3550
  N3551[recover()]:::mth
  N3547 --> N3551
  N3552[recover()]:::mth
  N3547 --> N3552
  N3553[File: ErrorFactory.ts]:::file
  N3431 --> N3553
  N3554[Class: for]:::cls
  N3553 --> N3554
  N3555[createApplicationError()]:::mth
  N3554 --> N3555
  N3556[fromHttpResponse()]:::mth
  N3554 --> N3556
  N3557[fromError()]:::mth
  N3554 --> N3557
  N3558[network()]:::mth
  N3554 --> N3558
  N3559[timeout()]:::mth
  N3554 --> N3559
  N3560[Class: ErrorFactory]:::cls
  N3553 --> N3560
  N3561[createApplicationError()]:::mth
  N3560 --> N3561
  N3562[fromHttpResponse()]:::mth
  N3560 --> N3562
  N3563[fromError()]:::mth
  N3560 --> N3563
  N3564[network()]:::mth
  N3560 --> N3564
  N3565[timeout()]:::mth
  N3560 --> N3565
  N3566[File: ErrorMessages.ts]:::file
  N3431 --> N3566
  N3567[Class: ErrorMessageFormatter]:::cls
  N3566 --> N3567
  N3568[setLanguage()]:::mth
  N3567 --> N3568
  N3569[getLanguage()]:::mth
  N3567 --> N3569
  N3570[format()]:::mth
  N3567 --> N3570
  N3571[getMessageByCode()]:::mth
  N3567 --> N3571
  N3572[getTitle()]:::mth
  N3567 --> N3572
  N3573[File: ErrorReproduction.ts]:::file
  N3431 --> N3573
  N3574[Class: ErrorRecorder]:::cls
  N3573 --> N3574
  N3575[record()]:::mth
  N3574 --> N3575
  N3576[addBreadcrumb()]:::mth
  N3574 --> N3576
  N3577[getRecording()]:::mth
  N3574 --> N3577
  N3578[getAllRecordings()]:::mth
  N3574 --> N3578
  N3579[exportRecording()]:::mth
  N3574 --> N3579
  N3580[Class: ErrorReplay]:::cls
  N3573 --> N3580
  N3581[record()]:::mth
  N3580 --> N3581
  N3582[addBreadcrumb()]:::mth
  N3580 --> N3582
  N3583[getRecording()]:::mth
  N3580 --> N3583
  N3584[getAllRecordings()]:::mth
  N3580 --> N3584
  N3585[exportRecording()]:::mth
  N3580 --> N3585
  N3586[File: Logger.ts]:::file
  N3431 --> N3586
  N3587[Class: Logger]:::cls
  N3586 --> N3587
  N3588[debug()]:::mth
  N3587 --> N3588
  N3589[info()]:::mth
  N3587 --> N3589
  N3590[warn()]:::mth
  N3587 --> N3590
  N3591[error()]:::mth
  N3587 --> N3591
  N3592[log()]:::mth
  N3587 --> N3592
  N3593[File: RetryLogic.ts]:::file
  N3431 --> N3593
  N3594[Class: RetryHandler]:::cls
  N3593 --> N3594
  N3595[getStatistics()]:::mth
  N3594 --> N3595
  N3596[getAllStatistics()]:::mth
  N3594 --> N3596
  N3597[clearStatistics()]:::mth
  N3594 --> N3597
  N3598[mergeConfig()]:::mth
  N3594 --> N3598
  N3599[calculateDelay()]:::mth
  N3594 --> N3599
  N3600[Class: CircuitBreaker]:::cls
  N3593 --> N3600
  N3601[getStatistics()]:::mth
  N3600 --> N3601
  N3602[getAllStatistics()]:::mth
  N3600 --> N3602
  N3603[clearStatistics()]:::mth
  N3600 --> N3603
  N3604[mergeConfig()]:::mth
  N3600 --> N3604
  N3605[calculateDelay()]:::mth
  N3600 --> N3605
  N3606[core-monitoring]:::pkg
  TNF --> N3606
  N3607[File: alert-manager.ts]:::file
  N3606 --> N3607
  N3608[Class: AlertManager]:::cls
  N3607 --> N3608
  N3609[addRule()]:::mth
  N3608 --> N3609
  N3610[removeRule()]:::mth
  N3608 --> N3610
  N3611[updateRule()]:::mth
  N3608 --> N3611
  N3612[getRules()]:::mth
  N3608 --> N3612
  N3613[getActiveAlerts()]:::mth
  N3608 --> N3613
  N3614[File: BaseMetricsCollector.ts]:::file
  N3606 --> N3614
  N3615[Class: BaseMetricsCollector]:::cls
  N3614 --> N3615
  N3616[start()]:::mth
  N3615 --> N3616
  N3617[stop()]:::mth
  N3615 --> N3617
  N3618[recordMetric()]:::mth
  N3615 --> N3618
  N3619[incrementCounter()]:::mth
  N3615 --> N3619
  N3620[recordHistogram()]:::mth
  N3615 --> N3620
  N3621[File: BaseMonitoringSystem.ts]:::file
  N3606 --> N3621
  N3622[Class: BaseMonitoringSystem]:::cls
  N3621 --> N3622
  N3623[initialize()]:::mth
  N3622 --> N3623
  N3624[shutdown()]:::mth
  N3622 --> N3624
  N3625[getMetricsCollector()]:::mth
  N3622 --> N3625
  N3626[exportMetrics()]:::mth
  N3622 --> N3626
  N3627[getStatus()]:::mth
  N3622 --> N3627
  N3628[File: performance-dashboard.ts]:::file
  N3606 --> N3628
  N3629[Class: PerformanceDashboard]:::cls
  N3628 --> N3629
  N3630[addMetrics()]:::mth
  N3629 --> N3630
  N3631[getCurrentMetrics()]:::mth
  N3629 --> N3631
  N3632[getMetricsHistory()]:::mth
  N3629 --> N3632
  N3633[getTimeSeries()]:::mth
  N3629 --> N3633
  N3634[getAlerts()]:::mth
  N3629 --> N3634
  N3635[File: health-check.ts]:::file
  N3606 --> N3635
  N3636[Class: HealthCheckService]:::cls
  N3635 --> N3636
  N3637[register()]:::mth
  N3636 --> N3637
  N3638[unregister()]:::mth
  N3636 --> N3638
  N3639[check()]:::mth
  N3636 --> N3639
  N3640[runCheck()]:::mth
  N3636 --> N3640
  N3641[startPeriodicChecks()]:::mth
  N3636 --> N3641
  N3642[Class: CommonHealthChecks]:::cls
  N3635 --> N3642
  N3643[register()]:::mth
  N3642 --> N3643
  N3644[unregister()]:::mth
  N3642 --> N3644
  N3645[check()]:::mth
  N3642 --> N3645
  N3646[runCheck()]:::mth
  N3642 --> N3646
  N3647[startPeriodicChecks()]:::mth
  N3642 --> N3647
  N3651[File: winston-logger.ts]:::file
  N3606 --> N3651
  N3652[Class: WinstonLogger]:::cls
  N3651 --> N3652
  N3653[initialize()]:::mth
  N3652 --> N3653
  N3654[formatConsoleLog()]:::mth
  N3652 --> N3654
  N3655[error()]:::mth
  N3652 --> N3655
  N3656[warn()]:::mth
  N3652 --> N3656
  N3657[info()]:::mth
  N3652 --> N3657
  N3658[File: prometheus-metrics.ts]:::file
  N3606 --> N3658
  N3659[Class: PrometheusMetrics]:::cls
  N3658 --> N3659
  N3660[initialize()]:::mth
  N3659 --> N3660
  N3661[initializeCommonMetrics()]:::mth
  N3659 --> N3661
  N3662[createMetric()]:::mth
  N3659 --> N3662
  N3663[recordHttpRequest()]:::mth
  N3659 --> N3663
  N3664[recordDatabaseQuery()]:::mth
  N3659 --> N3664
  N3665[File: health.controller.ts]:::file
  N3606 --> N3665
  N3666[Class: HealthControllerTemplate]:::cls
  N3665 --> N3666
  N3667[liveness()]:::mth
  N3666 --> N3667
  N3668[readiness()]:::mth
  N3666 --> N3668
  N3669[health()]:::mth
  N3666 --> N3669
  N3670[startup()]:::mth
  N3666 --> N3670
  N3671[liveness()]:::mth
  N3666 --> N3671
  N3672[Class: HealthController]:::cls
  N3665 --> N3672
  N3673[liveness()]:::mth
  N3672 --> N3673
  N3674[readiness()]:::mth
  N3672 --> N3674
  N3675[health()]:::mth
  N3672 --> N3675
  N3676[startup()]:::mth
  N3672 --> N3676
  N3677[liveness()]:::mth
  N3672 --> N3677
  N3678[File: metrics.controller.ts]:::file
  N3606 --> N3678
  N3679[Class: MetricsControllerTemplate]:::cls
  N3678 --> N3679
  N3680[metrics()]:::mth
  N3679 --> N3680
  N3681[getContentType()]:::mth
  N3679 --> N3681
  N3682[metrics()]:::mth
  N3679 --> N3682
  N3683[Class: MetricsController]:::cls
  N3678 --> N3683
  N3684[metrics()]:::mth
  N3683 --> N3684
  N3685[getContentType()]:::mth
  N3683 --> N3685
  N3686[metrics()]:::mth
  N3683 --> N3686
  N3687[File: monitoring.interceptor.ts]:::file
  N3606 --> N3687
  N3688[Class: MonitoringInterceptorTemplate]:::cls
  N3687 --> N3688
  N3689[intercept()]:::mth
  N3688 --> N3689
  N3690[Class: ErrorFilterTemplate]:::cls
  N3687 --> N3690
  N3691[intercept()]:::mth
  N3690 --> N3691
  N3692[File: monitoring.module.ts]:::file
  N3606 --> N3692
  N3693[Class: MonitoringModuleFactory]:::cls
  N3692 --> N3693
  N3694[forRoot()]:::mth
  N3693 --> N3694
  N3695[File: apm.ts]:::file
  N3606 --> N3695
  N3696[Class: APMService]:::cls
  N3695 --> N3696
  N3697[initialize()]:::mth
  N3696 --> N3697
  N3698[startTransaction()]:::mth
  N3696 --> N3698
  N3699[endTransaction()]:::mth
  N3696 --> N3699
  N3700[startSpan()]:::mth
  N3696 --> N3700
  N3701[endSpan()]:::mth
  N3696 --> N3701
  N3702[File: db-monitoring.ts]:::file
  N3606 --> N3702
  N3703[Class: DatabaseMonitor]:::cls
  N3702 --> N3703
  N3704[initialize()]:::mth
  N3703 --> N3704
  N3705[trackQuery()]:::mth
  N3703 --> N3705
  N3706[detected()]:::mth
  N3703 --> N3706
  N3707[recordPoolMetrics()]:::mth
  N3703 --> N3707
  N3708[getSlowQueries()]:::mth
  N3703 --> N3708
  N3710[File: web-vitals.ts]:::file
  N3606 --> N3710
  N3711[Class: WebVitalsMonitor]:::cls
  N3710 --> N3711
  N3712[initialize()]:::mth
  N3711 --> N3712
  N3713[handleMetric()]:::mth
  N3711 --> N3713
  N3714[getRating()]:::mth
  N3711 --> N3714
  N3715[trackCustomMetric()]:::mth
  N3711 --> N3715
  N3716[trackNavigationTiming()]:::mth
  N3711 --> N3716
  N3718[File: sentry-integrations.ts]:::file
  N3606 --> N3718
  N3719[Class: SentryService]:::cls
  N3718 --> N3719
  N3720[initialize()]:::mth
  N3719 --> N3720
  N3721[captureException()]:::mth
  N3719 --> N3721
  N3722[captureMessage()]:::mth
  N3719 --> N3722
  N3723[addBreadcrumb()]:::mth
  N3719 --> N3723
  N3724[setUser()]:::mth
  N3719 --> N3724
  N3725[File: Logger.ts]:::file
  N3606 --> N3725
  N3726[Class: Logger]:::cls
  N3725 --> N3726
  N3727[debug()]:::mth
  N3726 --> N3727
  N3728[info()]:::mth
  N3726 --> N3728
  N3729[warn()]:::mth
  N3726 --> N3729
  N3730[error()]:::mth
  N3726 --> N3730
  N3731[log()]:::mth
  N3726 --> N3731
  N3733[core-vector-db]:::pkg
  TNF --> N3733
  N3734[File: legacy-adapter.ts]:::file
  N3733 --> N3734
  N3735[Class: LegacyVectorAdapter]:::cls
  N3734 --> N3735
  N3736[storeVectors()]:::mth
  N3735 --> N3736
  N3737[search()]:::mth
  N3735 --> N3737
  N3738[deleteVectors()]:::mth
  N3735 --> N3738
  N3739[clearNamespace()]:::mth
  N3735 --> N3739
  N3740[generateId()]:::mth
  N3735 --> N3740
  N3741[Class: TypeConverter]:::cls
  N3734 --> N3741
  N3742[storeVectors()]:::mth
  N3741 --> N3742
  N3743[search()]:::mth
  N3741 --> N3743
  N3744[deleteVectors()]:::mth
  N3741 --> N3744
  N3745[clearNamespace()]:::mth
  N3741 --> N3745
  N3746[generateId()]:::mth
  N3741 --> N3746
  N3747[File: codebase-search.ts]:::file
  N3733 --> N3747
  N3748[Class: CodebaseSearch]:::cls
  N3747 --> N3748
  N3749[semanticSearch()]:::mth
  N3748 --> N3749
  N3750[findSimilarCode()]:::mth
  N3748 --> N3750
  N3751[findUsages()]:::mth
  N3748 --> N3751
  N3752[findDependencies()]:::mth
  N3748 --> N3752
  N3753[hybridSearch()]:::mth
  N3748 --> N3753
  N3754[File: codebase-vectorizer.ts]:::file
  N3733 --> N3754
  N3755[Class: CodebaseVectorizer]:::cls
  N3754 --> N3755
  N3756[vectorizeCodebase()]:::mth
  N3755 --> N3756
  N3757[scanCodebase()]:::mth
  N3755 --> N3757
  N3758[async()]:::mth
  N3755 --> N3758
  N3759[extractCodeEntities()]:::mth
  N3755 --> N3759
  N3760[extractBlock()]:::mth
  N3755 --> N3760
  N3761[Class: declarations]:::cls
  N3754 --> N3761
  N3762[vectorizeCodebase()]:::mth
  N3761 --> N3762
  N3763[scanCodebase()]:::mth
  N3761 --> N3763
  N3764[async()]:::mth
  N3761 --> N3764
  N3765[extractCodeEntities()]:::mth
  N3761 --> N3765
  N3766[extractBlock()]:::mth
  N3761 --> N3766
  N3768[File: openai-embedding.provider.ts]:::file
  N3733 --> N3768
  N3769[Class: OpenAIEmbeddingProvider]:::cls
  N3768 --> N3769
  N3770[generateEmbedding()]:::mth
  N3769 --> N3770
  N3771[generateEmbeddings()]:::mth
  N3769 --> N3771
  N3772[getDimension()]:::mth
  N3769 --> N3772
  N3773[getModelName()]:::mth
  N3769 --> N3773
  N3774[getDefaultDimension()]:::mth
  N3769 --> N3774
  N3775[File: pgvector.driver.ts]:::file
  N3733 --> N3775
  N3776[Class: PgVectorDriver]:::cls
  N3775 --> N3776
  N3777[initializeExtensions()]:::mth
  N3776 --> N3777
  N3778[createCollection()]:::mth
  N3776 --> N3778
  N3779[deleteCollection()]:::mth
  N3776 --> N3779
  N3780[sanitizeIdentifier()]:::mth
  N3776 --> N3780
  N3781[listCollections()]:::mth
  N3776 --> N3781
  N3782[File: qdrant.driver.ts]:::file
  N3733 --> N3782
  N3783[Class: QdrantDriver]:::cls
  N3782 --> N3783
  N3784[initializeConnection()]:::mth
  N3783 --> N3784
  N3785[createCollection()]:::mth
  N3783 --> N3785
  N3786[deleteCollection()]:::mth
  N3783 --> N3786
  N3787[listCollections()]:::mth
  N3783 --> N3787
  N3788[collectionExists()]:::mth
  N3783 --> N3788
  N3789[File: vector-store-grpc.controller.ts]:::file
  N3733 --> N3789
  N3790[Class: VectorStoreGrpcController]:::cls
  N3789 --> N3790
  N3791[createCollection()]:::mth
  N3790 --> N3791
  N3792[upsertDocuments()]:::mth
  N3790 --> N3792
  N3793[getDocument()]:::mth
  N3790 --> N3793
  N3794[similaritySearch()]:::mth
  N3790 --> N3794
  N3795[healthCheck()]:::mth
  N3790 --> N3795
  N3796[File: health.controller.ts]:::file
  N3733 --> N3796
  N3797[Class: HealthController]:::cls
  N3796 --> N3797
  N3798[check()]:::mth
  N3797 --> N3798
  N3804[File: vector-database.module.ts]:::file
  N3733 --> N3804
  N3805[Class: VectorDatabaseModule]:::cls
  N3804 --> N3805
  N3806[forRoot()]:::mth
  N3805 --> N3806
  N3807[File: vector-database.service.ts]:::file
  N3733 --> N3807
  N3808[Class: VectorDatabaseService]:::cls
  N3807 --> N3808
  N3809[onModuleInit()]:::mth
  N3808 --> N3809
  N3810[initializeProviders()]:::mth
  N3808 --> N3810
  N3811[createCollection()]:::mth
  N3808 --> N3811
  N3812[deleteCollection()]:::mth
  N3808 --> N3812
  N3813[listCollections()]:::mth
  N3808 --> N3813
  N3814[crypto-agent-framework]:::pkg
  TNF --> N3814
  N3815[File: crypto-agent-executor.service.ts]:::file
  N3814 --> N3815
  N3816[Class: CryptoAgentExecutorService]:::cls
  N3815 --> N3816
  N3817[onModuleInit()]:::mth
  N3816 --> N3817
  N3818[onModuleDestroy()]:::mth
  N3816 --> N3818
  N3819[initializeSocketMode()]:::mth
  N3816 --> N3819
  N3820[initializeProcessMode()]:::mth
  N3816 --> N3820
  N3821[waitForSocket()]:::mth
  N3816 --> N3821
  N3822[File: crypto-agent.controller.ts]:::file
  N3814 --> N3822
  N3823[Class: CryptoAgentController]:::cls
  N3822 --> N3823
  N3824[getStatus()]:::mth
  N3823 --> N3824
  N3825[File: crypto-agent.service.ts]:::file
  N3814 --> N3825
  N3826[Class: CryptoAgentService]:::cls
  N3825 --> N3826
  N3827[onModuleInit()]:::mth
  N3826 --> N3827
  N3828[initialize()]:::mth
  N3826 --> N3828
  N3829[initializeHttpApi()]:::mth
  N3826 --> N3829
  N3830[initializeChildProcess()]:::mth
  N3826 --> N3830
  N3831[initializeSocket()]:::mth
  N3826 --> N3831
  N3832[data]:::pkg
  TNF --> N3832
  N3833[File: index.ts]:::file
  N3832 --> N3833
  N3834[Class: DataStack]:::cls
  N3833 --> N3834
  N3835[getRelational()]:::mth
  N3834 --> N3835
  N3836[getQueryClient()]:::mth
  N3834 --> N3836
  N3837[createVectorService()]:::mth
  N3834 --> N3837
  N3838[database]:::pkg
  TNF --> N3838
  N3843[File: promote-user.ts]:::file
  N3838 --> N3843
  N3844[(Table: users)]:::tbl
  N3843 --> N3844
  N3845[File: provision-testing-swarm.ts]:::file
  N3838 --> N3845
  N3846[(Table: users)]:::tbl
  N3845 --> N3846
  N3852[File: database.service.ts]:::file
  N3838 --> N3852
  N3853[Class: MyService]:::cls
  N3852 --> N3853
  N3854[getUser()]:::mth
  N3853 --> N3854
  N3855[onModuleInit()]:::mth
  N3853 --> N3855
  N3856[onModuleDestroy()]:::mth
  N3853 --> N3856
  N3857[client()]:::mth
  N3853 --> N3857
  N3858[isConnected()]:::mth
  N3853 --> N3858
  N3859[Class: DatabaseService]:::cls
  N3852 --> N3859
  N3860[getUser()]:::mth
  N3859 --> N3860
  N3861[onModuleInit()]:::mth
  N3859 --> N3861
  N3862[onModuleDestroy()]:::mth
  N3859 --> N3862
  N3863[client()]:::mth
  N3859 --> N3863
  N3864[isConnected()]:::mth
  N3859 --> N3864
  N3865[File: drizzle.module.ts]:::file
  N3838 --> N3865
  N3866[Class: AppModule]:::cls
  N3865 --> N3866
  N3867[DatabaseService()]:::mth
  N3866 --> N3867
  N3868[forRoot()]:::mth
  N3866 --> N3868
  N3869[forRootAsync()]:::mth
  N3866 --> N3869
  N3870[client()]:::mth
  N3866 --> N3870
  N3871[healthCheck()]:::mth
  N3866 --> N3871
  N3872[Class: DrizzleModule]:::cls
  N3865 --> N3872
  N3873[DatabaseService()]:::mth
  N3872 --> N3873
  N3874[forRoot()]:::mth
  N3872 --> N3874
  N3875[forRootAsync()]:::mth
  N3872 --> N3875
  N3876[client()]:::mth
  N3872 --> N3876
  N3877[healthCheck()]:::mth
  N3872 --> N3877
  N3878[Class: DrizzleService]:::cls
  N3865 --> N3878
  N3879[DatabaseService()]:::mth
  N3878 --> N3879
  N3880[forRoot()]:::mth
  N3878 --> N3880
  N3881[forRootAsync()]:::mth
  N3878 --> N3881
  N3882[client()]:::mth
  N3878 --> N3882
  N3883[healthCheck()]:::mth
  N3878 --> N3883
  N3885[File: agent-api-grant.repository.ts]:::file
  N3838 --> N3885
  N3886[Class: DrizzleAgentApiGrantRepository]:::cls
  N3885 --> N3886
  N3887[listByUser()]:::mth
  N3886 --> N3887
  N3888[findByIdForUser()]:::mth
  N3886 --> N3888
  N3889[findById()]:::mth
  N3886 --> N3889
  N3890[create()]:::mth
  N3886 --> N3890
  N3891[revoke()]:::mth
  N3886 --> N3891
  N3892[File: agent-managed-account.repository.ts]:::file
  N3838 --> N3892
  N3893[Class: DrizzleAgentManagedAccountRepository]:::cls
  N3892 --> N3893
  N3894[getEncryptionSecret()]:::mth
  N3893 --> N3894
  N3895[encrypt()]:::mth
  N3893 --> N3895
  N3896[decrypt()]:::mth
  N3893 --> N3896
  N3897[buildPreview()]:::mth
  N3893 --> N3897
  N3898[normalizeValue()]:::mth
  N3893 --> N3898
  N3899[File: agent.repository.ts]:::file
  N3838 --> N3899
  N3900[Class: DrizzleAgentRepository]:::cls
  N3899 --> N3900
  N3901[hashToken()]:::mth
  N3900 --> N3901
  N3902[create()]:::mth
  N3900 --> N3902
  N3903[findById()]:::mth
  N3900 --> N3903
  N3904[eq()]:::mth
  N3900 --> N3904
  N3905[findByIdWithMetadata()]:::mth
  N3900 --> N3905
  N3906[File: api-logs.repository.ts]:::file
  N3838 --> N3906
  N3907[Class: DrizzleApiLogsRepository]:::cls
  N3906 --> N3907
  N3908[logRequest()]:::mth
  N3907 --> N3908
  N3909[getRecentLogs()]:::mth
  N3907 --> N3909
  N3910[getStats()]:::mth
  N3907 --> N3910
  N3911[getStatusCodeDistribution()]:::mth
  N3907 --> N3911
  N3912[getMethodDistribution()]:::mth
  N3907 --> N3912
  N3913[File: audit-logs.repository.ts]:::file
  N3838 --> N3913
  N3914[Class: DrizzleAuditLogsRepository]:::cls
  N3913 --> N3914
  N3915[create()]:::mth
  N3914 --> N3915
  N3916[findById()]:::mth
  N3914 --> N3916
  N3917[findAll()]:::mth
  N3914 --> N3917
  N3918[count()]:::mth
  N3914 --> N3918
  N3919[countActiveUsers()]:::mth
  N3914 --> N3919
  N3920[File: chat.repository.ts]:::file
  N3838 --> N3920
  N3921[Class: DrizzleChatRepository]:::cls
  N3920 --> N3921
  N3922[createChat()]:::mth
  N3921 --> N3922
  N3923[findParticipantsByRoomId()]:::mth
  N3921 --> N3923
  N3924[addParticipant()]:::mth
  N3921 --> N3924
  N3925[findParticipant()]:::mth
  N3921 --> N3925
  N3926[updateParticipant()]:::mth
  N3921 --> N3926
  N3927[File: configuration.repository.ts]:::file
  N3838 --> N3927
  N3928[Class: DrizzleConfigurationRepository]:::cls
  N3927 --> N3928
  N3929[findAllConfigs()]:::mth
  N3928 --> N3929
  N3930[findConfigByKey()]:::mth
  N3928 --> N3930
  N3931[updateConfig()]:::mth
  N3928 --> N3931
  N3932[createConfig()]:::mth
  N3928 --> N3932
  N3933[getSystemSettings()]:::mth
  N3928 --> N3933
  N3934[File: feedback.repository.ts]:::file
  N3838 --> N3934
  N3935[Class: DrizzleFeedbackRepository]:::cls
  N3934 --> N3935
  N3936[create()]:::mth
  N3935 --> N3936
  N3937[findAll()]:::mth
  N3935 --> N3937
  N3938[findById()]:::mth
  N3935 --> N3938
  N3939[getStats()]:::mth
  N3935 --> N3939
  N3941[File: jules.repository.ts]:::file
  N3838 --> N3941
  N3942[Class: DrizzleJulesRepository]:::cls
  N3941 --> N3942
  N3943[createConfig()]:::mth
  N3942 --> N3943
  N3944[findConfigByUserId()]:::mth
  N3942 --> N3944
  N3945[updateConfig()]:::mth
  N3942 --> N3945
  N3946[createSession()]:::mth
  N3942 --> N3946
  N3947[findSessionByJulesSessionId()]:::mth
  N3942 --> N3947
  N3948[File: llm_config.repository.ts]:::file
  N3838 --> N3948
  N3949[Class: DrizzleLLMConfigRepository]:::cls
  N3948 --> N3949
  N3950[encrypt()]:::mth
  N3949 --> N3950
  N3951[decrypt()]:::mth
  N3949 --> N3951
  N3952[findAll()]:::mth
  N3949 --> N3952
  N3953[findEnabled()]:::mth
  N3949 --> N3953
  N3954[findById()]:::mth
  N3949 --> N3954
  N3955[File: marketplace-catalog.repository.ts]:::file
  N3838 --> N3955
  N3956[Class: DrizzleMarketplaceCatalogRepository]:::cls
  N3955 --> N3956
  N3957[count()]:::mth
  N3956 --> N3957
  N3958[findAll()]:::mth
  N3956 --> N3958
  N3959[findByIdOrSlug()]:::mth
  N3956 --> N3959
  N3960[insertIfMissing()]:::mth
  N3956 --> N3960
  N3961[upsert()]:::mth
  N3956 --> N3961
  N3964[File: prompt-template.repository.ts]:::file
  N3838 --> N3964
  N3965[Class: DrizzlePromptTemplateRepository]:::cls
  N3964 --> N3965
  N3966[createTemplate()]:::mth
  N3965 --> N3966
  N3967[findTemplateByIdAndUser()]:::mth
  N3965 --> N3967
  N3968[updateTemplate()]:::mth
  N3965 --> N3968
  N3969[deleteTemplate()]:::mth
  N3965 --> N3969
  N3970[listTemplates()]:::mth
  N3965 --> N3970
  N3971[File: provider-api-key.repository.ts]:::file
  N3838 --> N3971
  N3972[Class: DrizzleProviderApiKeyRepository]:::cls
  N3971 --> N3972
  N3973[getEncryptionSecret()]:::mth
  N3972 --> N3973
  N3974[encrypt()]:::mth
  N3972 --> N3974
  N3975[decrypt()]:::mth
  N3972 --> N3975
  N3976[normalizeProvider()]:::mth
  N3972 --> N3976
  N3977[buildPreview()]:::mth
  N3972 --> N3977
  N3978[File: task.repository.ts]:::file
  N3838 --> N3978
  N3979[Class: DrizzleTaskRepository]:::cls
  N3978 --> N3979
  N3980[createTask()]:::mth
  N3979 --> N3980
  N3981[findTasksCreatedAfter()]:::mth
  N3979 --> N3981
  N3982[findTaskById()]:::mth
  N3979 --> N3982
  N3983[findTasksByUserId()]:::mth
  N3979 --> N3983
  N3984[findTasksByPipelineId()]:::mth
  N3979 --> N3984
  N3985[File: user.repository.ts]:::file
  N3838 --> N3985
  N3986[Class: DrizzleUserRepository]:::cls
  N3985 --> N3986
  N3987[create()]:::mth
  N3986 --> N3987
  N3988[findById()]:::mth
  N3986 --> N3988
  N3989[findByEmail()]:::mth
  N3986 --> N3989
  N3990[findByWalletAddress()]:::mth
  N3986 --> N3990
  N3991[findByVerificationToken()]:::mth
  N3986 --> N3991
  N3992[File: wallet.repository.ts]:::file
  N3838 --> N3992
  N3993[Class: DrizzleWalletRepository]:::cls
  N3992 --> N3993
  N3994[create()]:::mth
  N3993 --> N3994
  N3995[findById()]:::mth
  N3993 --> N3995
  N3996[findByIdWithAgent()]:::mth
  N3993 --> N3996
  N3997[findByAddress()]:::mth
  N3993 --> N3997
  N3998[findByAddressWithAgent()]:::mth
  N3993 --> N3998
  N3999[File: webhook.repository.ts]:::file
  N3838 --> N3999
  N4000[Class: DrizzleWebhookRepository]:::cls
  N3999 --> N4000
  N4001[createWebhookConfiguration()]:::mth
  N4000 --> N4001
  N4002[findWebhookConfigurationById()]:::mth
  N4000 --> N4002
  N4003[findWebhookConfigurationBySource()]:::mth
  N4000 --> N4003
  N4004[findWebhookConfigurationsByOrganization()]:::mth
  N4000 --> N4004
  N4005[findActiveWebhookBySource()]:::mth
  N4000 --> N4005
  N4006[File: workflow.repository.ts]:::file
  N3838 --> N4006
  N4007[Class: DrizzleWorkflowRepository]:::cls
  N4006 --> N4007
  N4008[createWorkflow()]:::mth
  N4007 --> N4008
  N4009[findWorkflowById()]:::mth
  N4007 --> N4009
  N4010[findWorkflowWithSteps()]:::mth
  N4007 --> N4010
  N4011[findWorkflowsByCreatorId()]:::mth
  N4007 --> N4011
  N4012[findActiveWorkflows()]:::mth
  N4007 --> N4012
  N4013[File: workspace-bookmark.repository.ts]:::file
  N3838 --> N4013
  N4014[Class: DrizzleWorkspaceBookmarkRepository]:::cls
  N4013 --> N4014
  N4015[listByWorkspace()]:::mth
  N4014 --> N4015
  N4016[listByWorkspaceForUser()]:::mth
  N4014 --> N4016
  N4017[findById()]:::mth
  N4014 --> N4017
  N4018[findByIdForUser()]:::mth
  N4014 --> N4018
  N4019[findByUrl()]:::mth
  N4014 --> N4019
  N4020[File: workspace-domain.repository.ts]:::file
  N3838 --> N4020
  N4021[Class: DrizzleWorkspaceDomainRepository]:::cls
  N4020 --> N4021
  N4022[listByWorkspace()]:::mth
  N4021 --> N4022
  N4023[findById()]:::mth
  N4021 --> N4023
  N4024[findByDomain()]:::mth
  N4021 --> N4024
  N4025[addDomain()]:::mth
  N4021 --> N4025
  N4026[removeDomain()]:::mth
  N4021 --> N4026
  N4027[File: workspace-member.repository.ts]:::file
  N3838 --> N4027
  N4028[Class: DrizzleWorkspaceMemberRepository]:::cls
  N4027 --> N4028
  N4029[addMember()]:::mth
  N4028 --> N4029
  N4030[upsertMember()]:::mth
  N4028 --> N4030
  N4031[findMembership()]:::mth
  N4028 --> N4031
  N4032[listByWorkspace()]:::mth
  N4028 --> N4032
  N4033[listByWorkspaceWithUsers()]:::mth
  N4028 --> N4033
  N4034[File: workspace.repository.ts]:::file
  N3838 --> N4034
  N4035[Class: DrizzleWorkspaceRepository]:::cls
  N4034 --> N4035
  N4036[create()]:::mth
  N4035 --> N4036
  N4037[findById()]:::mth
  N4035 --> N4037
  N4038[findByName()]:::mth
  N4035 --> N4038
  N4039[findByOwner()]:::mth
  N4035 --> N4039
  N4040[findByUserId()]:::mth
  N4035 --> N4040
  N4042[File: agent-tracking.ts]:::file
  N3838 --> N4042
  N4043[(Table: agentTracking)]:::tbl
  N4042 --> N4043
  N4044[(Table: agentSessions)]:::tbl
  N4042 --> N4044
  N4045[(Table: agentRequestLog)]:::tbl
  N4042 --> N4045
  N4046[File: agents.ts]:::file
  N3838 --> N4046
  N4047[(Table: agents)]:::tbl
  N4046 --> N4047
  N4048[(Table: agentMetadata)]:::tbl
  N4046 --> N4048
  N4049[(Table: agentNfts)]:::tbl
  N4046 --> N4049
  N4050[(Table: agentRegistrations)]:::tbl
  N4046 --> N4050
  N4051[(Table: agentCapabilityRegistry)]:::tbl
  N4046 --> N4051
  N4052[(Table: agentOnboardingEvents)]:::tbl
  N4046 --> N4052
  N4053[(Table: agentDirectoryEntries)]:::tbl
  N4046 --> N4053
  N4054[(Table: agentPromptVersions)]:::tbl
  N4046 --> N4054
  N4055[(Table: agentMetrics)]:::tbl
  N4046 --> N4055
  N4057[File: api-logs.ts]:::file
  N3838 --> N4057
  N4058[(Table: apiLogs)]:::tbl
  N4057 --> N4058
  N4059[File: audit-logs.ts]:::file
  N3838 --> N4059
  N4060[(Table: auditLogs)]:::tbl
  N4059 --> N4060
  N4061[File: billing.ts]:::file
  N3838 --> N4061
  N4062[(Table: payPalSubscriptions)]:::tbl
  N4061 --> N4062
  N4063[(Table: stripeSubscriptions)]:::tbl
  N4061 --> N4063
  N4064[(Table: creditBalances)]:::tbl
  N4061 --> N4064
  N4065[(Table: usageRecords)]:::tbl
  N4061 --> N4065
  N4066[File: chat.ts]:::file
  N3838 --> N4066
  N4067[(Table: chats)]:::tbl
  N4066 --> N4067
  N4068[(Table: chatRooms)]:::tbl
  N4066 --> N4068
  N4069[(Table: messages)]:::tbl
  N4066 --> N4069
  N4070[(Table: chatMessages)]:::tbl
  N4066 --> N4070
  N4071[(Table: chatRoomParticipants)]:::tbl
  N4066 --> N4071
  N4072[(Table: readReceipts)]:::tbl
  N4066 --> N4072
  N4073[File: code-execution.ts]:::file
  N3838 --> N4073
  N4074[(Table: codeExecutionUsage)]:::tbl
  N4073 --> N4074
  N4075[(Table: codeExecutionSessions)]:::tbl
  N4073 --> N4075
  N4076[File: configuration.ts]:::file
  N3838 --> N4076
  N4077[(Table: systemConfigurations)]:::tbl
  N4076 --> N4077
  N4078[(Table: systemSettings)]:::tbl
  N4076 --> N4078
  N4079[(Table: providerApiKeys)]:::tbl
  N4076 --> N4079
  N4080[(Table: agentApiGrants)]:::tbl
  N4076 --> N4080
  N4081[(Table: agentApiGrantUsage)]:::tbl
  N4076 --> N4081
  N4082[(Table: agentManagedAccounts)]:::tbl
  N4076 --> N4082
  N4083[(Table: agentManagedAccountGrants)]:::tbl
  N4076 --> N4083
  N4084[File: entitlements.ts]:::file
  N3838 --> N4084
  N4085[(Table: membershipOverrides)]:::tbl
  N4084 --> N4085
  N4086[(Table: gameAccessRules)]:::tbl
  N4084 --> N4086
  N4087[(Table: gameEntitlements)]:::tbl
  N4084 --> N4087
  N4089[File: feedback.ts]:::file
  N3838 --> N4089
  N4090[(Table: feedbackTypeEnum)]:::tbl
  N4089 --> N4090
  N4091[(Table: feedbackPriorityEnum)]:::tbl
  N4089 --> N4091
  N4092[(Table: feedbackStatusEnum)]:::tbl
  N4089 --> N4092
  N4093[(Table: feedback)]:::tbl
  N4089 --> N4093
  N4094[(Table: feedbackToTasks)]:::tbl
  N4089 --> N4094
  N4096[File: jules.ts]:::file
  N3838 --> N4096
  N4097[(Table: julesConfigs)]:::tbl
  N4096 --> N4097
  N4098[(Table: julesSessions)]:::tbl
  N4096 --> N4098
  N4099[(Table: julesUsageLogs)]:::tbl
  N4096 --> N4099
  N4100[File: marketplace.ts]:::file
  N3838 --> N4100
  N4101[(Table: fractionalShares)]:::tbl
  N4100 --> N4101
  N4102[(Table: revenueStreams)]:::tbl
  N4100 --> N4102
  N4103[(Table: revenueDistributions)]:::tbl
  N4100 --> N4103
  N4104[(Table: marketplaceListings)]:::tbl
  N4100 --> N4104
  N4105[(Table: marketplaceOffers)]:::tbl
  N4100 --> N4105
  N4106[(Table: marketplaceCatalogItems)]:::tbl
  N4100 --> N4106
  N4107[File: mass.ts]:::file
  N3838 --> N4107
  N4108[(Table: optimizationJobs)]:::tbl
  N4107 --> N4108
  N4109[(Table: workflowTopologies)]:::tbl
  N4107 --> N4109
  N4110[File: personal-skills.ts]:::file
  N3838 --> N4110
  N4111[(Table: personalSkills)]:::tbl
  N4110 --> N4111
  N4112[File: prompt-templates.ts]:::file
  N3838 --> N4112
  N4113[(Table: promptTemplates)]:::tbl
  N4112 --> N4113
  N4114[(Table: promptVersions)]:::tbl
  N4112 --> N4114
  N4115[(Table: promptSnippets)]:::tbl
  N4112 --> N4115
  N4116[(Table: promptExecutionResults)]:::tbl
  N4112 --> N4116
  N4117[File: resource-interactions.ts]:::file
  N3838 --> N4117
  N4118[(Table: resourceFavorites)]:::tbl
  N4117 --> N4118
  N4119[(Table: resourceShares)]:::tbl
  N4117 --> N4119
  N4120[File: system.ts]:::file
  N3838 --> N4120
  N4121[(Table: registeredEntities)]:::tbl
  N4120 --> N4121
  N4122[(Table: llmConfigs)]:::tbl
  N4120 --> N4122
  N4123[(Table: validationDatasets)]:::tbl
  N4120 --> N4123
  N4124[(Table: businessMetrics)]:::tbl
  N4120 --> N4124
  N4125[(Table: errorLogs)]:::tbl
  N4120 --> N4125
  N4126[(Table: notifications)]:::tbl
  N4120 --> N4126
  N4127[File: tasks.ts]:::file
  N3838 --> N4127
  N4128[(Table: pipelines)]:::tbl
  N4127 --> N4128
  N4129[(Table: tasks)]:::tbl
  N4127 --> N4129
  N4130[(Table: taskExecutions)]:::tbl
  N4127 --> N4130
  N4131[File: tnf.ts]:::file
  N3838 --> N4131
  N4132[(Table: tnfLlmModels)]:::tbl
  N4131 --> N4132
  N4133[(Table: tnfHarnesses)]:::tbl
  N4131 --> N4133
  N4134[(Table: tnfMcpServers)]:::tbl
  N4131 --> N4134
  N4135[(Table: tnfAgentDefinitions)]:::tbl
  N4131 --> N4135
  N4136[(Table: tnfAgentSessions)]:::tbl
  N4131 --> N4136
  N4137[(Table: tnfSessionMcps)]:::tbl
  N4131 --> N4137
  N4138[File: users.ts]:::file
  N3838 --> N4138
  N4139[(Table: users)]:::tbl
  N4138 --> N4139
  N4140[(Table: registrationInviteCodes)]:::tbl
  N4138 --> N4140
  N4141[(Table: authSessions)]:::tbl
  N4138 --> N4141
  N4142[(Table: loginAttempts)]:::tbl
  N4138 --> N4142
  N4143[(Table: authEvents)]:::tbl
  N4138 --> N4143
  N4144[File: wallets.ts]:::file
  N3838 --> N4144
  N4145[(Table: wallets)]:::tbl
  N4144 --> N4145
  N4146[(Table: transactions)]:::tbl
  N4144 --> N4146
  N4147[File: webhooks.ts]:::file
  N3838 --> N4147
  N4148[(Table: webhookConfigurations)]:::tbl
  N4147 --> N4148
  N4149[(Table: businessEvents)]:::tbl
  N4147 --> N4149
  N4150[(Table: sseSubscriptions)]:::tbl
  N4147 --> N4150
  N4151[(Table: webhookDeliveryLogs)]:::tbl
  N4147 --> N4151
  N4152[(Table: businessAnalytics)]:::tbl
  N4147 --> N4152
  N4153[(Table: aiInsights)]:::tbl
  N4147 --> N4153
  N4154[File: workflows.ts]:::file
  N3838 --> N4154
  N4155[(Table: workflows)]:::tbl
  N4154 --> N4155
  N4156[(Table: workflowSteps)]:::tbl
  N4154 --> N4156
  N4157[(Table: workflowExecutions)]:::tbl
  N4154 --> N4157
  N4158[(Table: workflowTemplates)]:::tbl
  N4154 --> N4158
  N4159[File: workspace.ts]:::file
  N3838 --> N4159
  N4160[(Table: workspaceDomains)]:::tbl
  N4159 --> N4160
  N4161[(Table: workspaceBookmarks)]:::tbl
  N4159 --> N4161
  N4162[(Table: workspaces)]:::tbl
  N4159 --> N4162
  N4163[(Table: workspaceMembers)]:::tbl
  N4159 --> N4163
  N4164[(Table: projects)]:::tbl
  N4159 --> N4164
  N4165[(Table: projectDocuments)]:::tbl
  N4159 --> N4165
  N4166[(Table: projectCollections)]:::tbl
  N4159 --> N4166
  N4167[(Table: collectionItems)]:::tbl
  N4159 --> N4167
  N4168[(Table: agentMemories)]:::tbl
  N4159 --> N4168
  N4169[(Table: resourceAllocations)]:::tbl
  N4159 --> N4169
  N4170[(Table: syncStates)]:::tbl
  N4159 --> N4170
  N4171[(Table: syncConflicts)]:::tbl
  N4159 --> N4171
  N4179[debugging]:::pkg
  TNF --> N4179
  N4180[File: a2a-debugger.service.ts]:::file
  N4179 --> N4180
  N4181[Class: A2ADebuggerService]:::cls
  N4180 --> N4181
  N4182[onModuleInit()]:::mth
  N4181 --> N4182
  N4183[createDebugSession()]:::mth
  N4181 --> N4183
  N4184[stopDebugSession()]:::mth
  N4181 --> N4184
  N4185[setActiveSession()]:::mth
  N4181 --> N4185
  N4186[captureMessage()]:::mth
  N4181 --> N4186
  N4187[File: debugger.controller.ts]:::file
  N4179 --> N4187
  N4188[Class: DebuggerController]:::cls
  N4187 --> N4188
  N4189[getDebugDashboard()]:::mth
  N4188 --> N4189
  N4190[getDebuggerHealth()]:::mth
  N4188 --> N4190
  N4191[File: debugging.module.ts]:::file
  N4179 --> N4191
  N4192[Class: DebuggingModule]:::cls
  N4191 --> N4192
  N4193[deployment-core]:::pkg
  TNF --> N4193
  N4195[File: CICDPipeline.ts]:::file
  N4193 --> N4195
  N4196[Class: CICDPipeline]:::cls
  N4195 --> N4196
  N4197[triggerBuild()]:::mth
  N4196 --> N4197
  N4198[executePipeline()]:::mth
  N4196 --> N4198
  N4199[deployToEnvironment()]:::mth
  N4196 --> N4199
  N4200[rollbackDeployment()]:::mth
  N4196 --> N4200
  N4201[monitorPipeline()]:::mth
  N4196 --> N4201
  N4202[File: MetricsCollector.ts]:::file
  N4193 --> N4202
  N4203[Class: MetricsCollector]:::cls
  N4202 --> N4203
  N4204[recordPipelineMetrics()]:::mth
  N4203 --> N4204
  N4205[recordBuildMetrics()]:::mth
  N4203 --> N4205
  N4206[recordDeploymentMetrics()]:::mth
  N4203 --> N4206
  N4207[getPipelineMetrics()]:::mth
  N4203 --> N4207
  N4208[recordProvisioningMetrics()]:::mth
  N4203 --> N4208
  N4209[File: NotificationService.ts]:::file
  N4193 --> N4209
  N4210[Class: NotificationService]:::cls
  N4209 --> N4210
  N4211[notifyPipelineStart()]:::mth
  N4210 --> N4211
  N4212[notifyPipelineComplete()]:::mth
  N4210 --> N4212
  N4213[notifyPipelineFailed()]:::mth
  N4210 --> N4213
  N4214[notifyBuildComplete()]:::mth
  N4210 --> N4214
  N4215[notifyDeploymentComplete()]:::mth
  N4210 --> N4215
  N4216[File: PipelineExecutor.ts]:::file
  N4193 --> N4216
  N4217[Class: PipelineExecutor]:::cls
  N4216 --> N4217
  N4218[executeTask()]:::mth
  N4217 --> N4218
  N4219[executeDeployment()]:::mth
  N4217 --> N4219
  N4220[executeRollback()]:::mth
  N4217 --> N4220
  N4221[cancelExecution()]:::mth
  N4217 --> N4221
  N4222[evaluateTaskConditions()]:::mth
  N4217 --> N4222
  N4223[File: PipelineStorage.ts]:::file
  N4193 --> N4223
  N4224[Class: PipelineStorage]:::cls
  N4223 --> N4224
  N4225[storePipelineConfig()]:::mth
  N4224 --> N4225
  N4226[getPipelineConfig()]:::mth
  N4224 --> N4226
  N4227[getAllPipelineConfigs()]:::mth
  N4224 --> N4227
  N4228[storePipelineResult()]:::mth
  N4224 --> N4228
  N4229[getPipelineResult()]:::mth
  N4224 --> N4229
  N4230[File: PipelineValidator.ts]:::file
  N4193 --> N4230
  N4231[Class: PipelineValidator]:::cls
  N4230 --> N4231
  N4232[validatePipeline()]:::mth
  N4231 --> N4232
  N4233[validateDeployment()]:::mth
  N4231 --> N4233
  N4234[validateBasicStructure()]:::mth
  N4231 --> N4234
  N4235[validateStages()]:::mth
  N4231 --> N4235
  N4236[validateTasks()]:::mth
  N4231 --> N4236
  N4237[File: BlueGreenStrategy.ts]:::file
  N4193 --> N4237
  N4238[Class: BlueGreenStrategy]:::cls
  N4237 --> N4238
  N4239[deploy()]:::mth
  N4238 --> N4239
  N4240[validate()]:::mth
  N4238 --> N4240
  N4241[rollback()]:::mth
  N4238 --> N4241
  N4242[getCurrentEnvironment()]:::mth
  N4238 --> N4242
  N4243[prepareTargetEnvironment()]:::mth
  N4238 --> N4243
  N4244[File: CanaryStrategy.ts]:::file
  N4193 --> N4244
  N4245[Class: CanaryStrategy]:::cls
  N4244 --> N4245
  N4246[deploy()]:::mth
  N4245 --> N4246
  N4247[validate()]:::mth
  N4245 --> N4247
  N4248[rollback()]:::mth
  N4245 --> N4248
  N4249[prepareCanaryDeployment()]:::mth
  N4245 --> N4249
  N4250[deployCanaryService()]:::mth
  N4245 --> N4250
  N4251[File: DeploymentOrchestrator.ts]:::file
  N4193 --> N4251
  N4252[Class: DeploymentOrchestrator]:::cls
  N4251 --> N4252
  N4253[executeDeployment()]:::mth
  N4252 --> N4253
  N4254[requestApproval()]:::mth
  N4252 --> N4254
  N4255[approveDeployment()]:::mth
  N4252 --> N4255
  N4256[rejectDeployment()]:::mth
  N4252 --> N4256
  N4257[getDeploymentProgress()]:::mth
  N4252 --> N4257
  N4258[File: DeploymentStrategy.ts]:::file
  N4193 --> N4258
  N4259[Class: for]:::cls
  N4258 --> N4259
  N4260[deploy()]:::mth
  N4259 --> N4260
  N4261[getHealthChecks()]:::mth
  N4259 --> N4261
  N4262[deploy()]:::mth
  N4259 --> N4262
  N4263[rollback()]:::mth
  N4259 --> N4263
  N4264[getProgress()]:::mth
  N4259 --> N4264
  N4265[Class: BaseDeploymentStrategy]:::cls
  N4258 --> N4265
  N4266[deploy()]:::mth
  N4265 --> N4266
  N4267[getHealthChecks()]:::mth
  N4265 --> N4267
  N4268[deploy()]:::mth
  N4265 --> N4268
  N4269[rollback()]:::mth
  N4265 --> N4269
  N4270[getProgress()]:::mth
  N4265 --> N4270
  N4271[File: RollingUpdateStrategy.ts]:::file
  N4193 --> N4271
  N4272[Class: RollingUpdateStrategy]:::cls
  N4271 --> N4272
  N4273[deploy()]:::mth
  N4272 --> N4273
  N4274[validate()]:::mth
  N4272 --> N4274
  N4275[rollback()]:::mth
  N4272 --> N4275
  N4276[prepareDeployment()]:::mth
  N4272 --> N4276
  N4277[deployServiceRolling()]:::mth
  N4272 --> N4277
  N4279[File: ChangeAnalyzer.ts]:::file
  N4193 --> N4279
  N4280[Class: ChangeAnalyzer]:::cls
  N4279 --> N4280
  N4281[analyzeChanges()]:::mth
  N4280 --> N4281
  N4282[planChanges()]:::mth
  N4280 --> N4282
  N4283[analyzeTemplateChanges()]:::mth
  N4280 --> N4283
  N4284[analyzeVariableChanges()]:::mth
  N4280 --> N4284
  N4285[analyzeResourceChanges()]:::mth
  N4280 --> N4285
  N4286[Class: RiskAnalyzer]:::cls
  N4279 --> N4286
  N4287[analyzeChanges()]:::mth
  N4286 --> N4287
  N4288[planChanges()]:::mth
  N4286 --> N4288
  N4289[analyzeTemplateChanges()]:::mth
  N4286 --> N4289
  N4290[analyzeVariableChanges()]:::mth
  N4286 --> N4290
  N4291[analyzeResourceChanges()]:::mth
  N4286 --> N4291
  N4292[Class: CostEstimator]:::cls
  N4279 --> N4292
  N4293[analyzeChanges()]:::mth
  N4292 --> N4293
  N4294[planChanges()]:::mth
  N4292 --> N4294
  N4295[analyzeTemplateChanges()]:::mth
  N4292 --> N4295
  N4296[analyzeVariableChanges()]:::mth
  N4292 --> N4296
  N4297[analyzeResourceChanges()]:::mth
  N4292 --> N4297
  N4298[Class: TimelineCalculator]:::cls
  N4279 --> N4298
  N4299[analyzeChanges()]:::mth
  N4298 --> N4299
  N4300[planChanges()]:::mth
  N4298 --> N4300
  N4301[analyzeTemplateChanges()]:::mth
  N4298 --> N4301
  N4302[analyzeVariableChanges()]:::mth
  N4298 --> N4302
  N4303[analyzeResourceChanges()]:::mth
  N4298 --> N4303
  N4304[File: EnvironmentManager.ts]:::file
  N4193 --> N4304
  N4305[Class: EnvironmentManager]:::cls
  N4304 --> N4305
  N4306[createEnvironment()]:::mth
  N4305 --> N4306
  N4307[updateEnvironment()]:::mth
  N4305 --> N4307
  N4308[deleteEnvironment()]:::mth
  N4305 --> N4308
  N4309[promoteEnvironment()]:::mth
  N4305 --> N4309
  N4310[getEnvironment()]:::mth
  N4305 --> N4310
  N4311[File: InfrastructureAutomation.ts]:::file
  N4193 --> N4311
  N4312[Class: InfrastructureAutomation]:::cls
  N4311 --> N4312
  N4313[start()]:::mth
  N4312 --> N4313
  N4314[stop()]:::mth
  N4312 --> N4314
  N4315[addAutomationRule()]:::mth
  N4312 --> N4315
  N4316[executeAutomationRule()]:::mth
  N4312 --> N4316
  N4317[addCompliancePolicy()]:::mth
  N4312 --> N4317
  N4319[File: InfrastructureManager.ts]:::file
  N4193 --> N4319
  N4320[Class: InfrastructureManager]:::cls
  N4319 --> N4320
  N4321[provisionInfrastructure()]:::mth
  N4320 --> N4321
  N4322[updateInfrastructure()]:::mth
  N4320 --> N4322
  N4323[destroyInfrastructure()]:::mth
  N4320 --> N4323
  N4324[validateTemplate()]:::mth
  N4320 --> N4324
  N4325[planChanges()]:::mth
  N4320 --> N4325
  N4326[File: ResourceProvisioner.ts]:::file
  N4193 --> N4326
  N4327[Class: ResourceProvisioner]:::cls
  N4326 --> N4327
  N4328[provision()]:::mth
  N4327 --> N4328
  N4329[provisionResources()]:::mth
  N4327 --> N4329
  N4330[destroyResources()]:::mth
  N4327 --> N4330
  N4331[applyChange()]:::mth
  N4327 --> N4331
  N4332[importResources()]:::mth
  N4327 --> N4332
  N4333[Class: ProvisioningQueue]:::cls
  N4326 --> N4333
  N4334[provision()]:::mth
  N4333 --> N4334
  N4335[provisionResources()]:::mth
  N4333 --> N4335
  N4336[destroyResources()]:::mth
  N4333 --> N4336
  N4337[applyChange()]:::mth
  N4333 --> N4337
  N4338[importResources()]:::mth
  N4333 --> N4338
  N4339[File: StateManager.ts]:::file
  N4193 --> N4339
  N4340[Class: StateManager]:::cls
  N4339 --> N4340
  N4341[save()]:::mth
  N4340 --> N4341
  N4342[saveState()]:::mth
  N4340 --> N4342
  N4343[getState()]:::mth
  N4340 --> N4343
  N4344[listStates()]:::mth
  N4340 --> N4344
  N4345[deleteState()]:::mth
  N4340 --> N4345
  N4346[Class: InMemoryStateStorage]:::cls
  N4339 --> N4346
  N4347[save()]:::mth
  N4346 --> N4347
  N4348[saveState()]:::mth
  N4346 --> N4348
  N4349[getState()]:::mth
  N4346 --> N4349
  N4350[listStates()]:::mth
  N4346 --> N4350
  N4351[deleteState()]:::mth
  N4346 --> N4351
  N4352[File: TemplateParser.ts]:::file
  N4193 --> N4352
  N4353[Class: TemplateParser]:::cls
  N4352 --> N4353
  N4354[parse()]:::mth
  N4353 --> N4354
  N4355[generateTemplate()]:::mth
  N4353 --> N4355
  N4356[resolveVariables()]:::mth
  N4353 --> N4356
  N4357[parseResources()]:::mth
  N4353 --> N4357
  N4358[buildDependencyGraph()]:::mth
  N4353 --> N4358
  N4359[Class: StringVariableResolver]:::cls
  N4352 --> N4359
  N4360[parse()]:::mth
  N4359 --> N4360
  N4361[generateTemplate()]:::mth
  N4359 --> N4361
  N4362[resolveVariables()]:::mth
  N4359 --> N4362
  N4363[parseResources()]:::mth
  N4359 --> N4363
  N4364[buildDependencyGraph()]:::mth
  N4359 --> N4364
  N4365[Class: NumberVariableResolver]:::cls
  N4352 --> N4365
  N4366[parse()]:::mth
  N4365 --> N4366
  N4367[generateTemplate()]:::mth
  N4365 --> N4367
  N4368[resolveVariables()]:::mth
  N4365 --> N4368
  N4369[parseResources()]:::mth
  N4365 --> N4369
  N4370[buildDependencyGraph()]:::mth
  N4365 --> N4370
  N4371[Class: BooleanVariableResolver]:::cls
  N4352 --> N4371
  N4372[parse()]:::mth
  N4371 --> N4372
  N4373[generateTemplate()]:::mth
  N4371 --> N4373
  N4374[resolveVariables()]:::mth
  N4371 --> N4374
  N4375[parseResources()]:::mth
  N4371 --> N4375
  N4376[buildDependencyGraph()]:::mth
  N4371 --> N4376
  N4377[Class: ListVariableResolver]:::cls
  N4352 --> N4377
  N4378[parse()]:::mth
  N4377 --> N4378
  N4379[generateTemplate()]:::mth
  N4377 --> N4379
  N4380[resolveVariables()]:::mth
  N4377 --> N4380
  N4381[parseResources()]:::mth
  N4377 --> N4381
  N4382[buildDependencyGraph()]:::mth
  N4377 --> N4382
  N4383[Class: MapVariableResolver]:::cls
  N4352 --> N4383
  N4384[parse()]:::mth
  N4383 --> N4384
  N4385[generateTemplate()]:::mth
  N4383 --> N4385
  N4386[resolveVariables()]:::mth
  N4383 --> N4386
  N4387[parseResources()]:::mth
  N4383 --> N4387
  N4388[buildDependencyGraph()]:::mth
  N4383 --> N4388
  N4389[Class: ObjectVariableResolver]:::cls
  N4352 --> N4389
  N4390[parse()]:::mth
  N4389 --> N4390
  N4391[generateTemplate()]:::mth
  N4389 --> N4391
  N4392[resolveVariables()]:::mth
  N4389 --> N4392
  N4393[parseResources()]:::mth
  N4389 --> N4393
  N4394[buildDependencyGraph()]:::mth
  N4389 --> N4394
  N4395[Class: ComputeResourceParser]:::cls
  N4352 --> N4395
  N4396[parse()]:::mth
  N4395 --> N4396
  N4397[generateTemplate()]:::mth
  N4395 --> N4397
  N4398[resolveVariables()]:::mth
  N4395 --> N4398
  N4399[parseResources()]:::mth
  N4395 --> N4399
  N4400[buildDependencyGraph()]:::mth
  N4395 --> N4400
  N4401[Class: StorageResourceParser]:::cls
  N4352 --> N4401
  N4402[parse()]:::mth
  N4401 --> N4402
  N4403[generateTemplate()]:::mth
  N4401 --> N4403
  N4404[resolveVariables()]:::mth
  N4401 --> N4404
  N4405[parseResources()]:::mth
  N4401 --> N4405
  N4406[buildDependencyGraph()]:::mth
  N4401 --> N4406
  N4407[Class: NetworkResourceParser]:::cls
  N4352 --> N4407
  N4408[parse()]:::mth
  N4407 --> N4408
  N4409[generateTemplate()]:::mth
  N4407 --> N4409
  N4410[resolveVariables()]:::mth
  N4407 --> N4410
  N4411[parseResources()]:::mth
  N4407 --> N4411
  N4412[buildDependencyGraph()]:::mth
  N4407 --> N4412
  N4413[Class: DatabaseResourceParser]:::cls
  N4352 --> N4413
  N4414[parse()]:::mth
  N4413 --> N4414
  N4415[generateTemplate()]:::mth
  N4413 --> N4415
  N4416[resolveVariables()]:::mth
  N4413 --> N4416
  N4417[parseResources()]:::mth
  N4413 --> N4417
  N4418[buildDependencyGraph()]:::mth
  N4413 --> N4418
  N4419[Class: LoadBalancerResourceParser]:::cls
  N4352 --> N4419
  N4420[parse()]:::mth
  N4419 --> N4420
  N4421[generateTemplate()]:::mth
  N4419 --> N4421
  N4422[resolveVariables()]:::mth
  N4419 --> N4422
  N4423[parseResources()]:::mth
  N4419 --> N4423
  N4424[buildDependencyGraph()]:::mth
  N4419 --> N4424
  N4425[File: TemplateValidator.ts]:::file
  N4193 --> N4425
  N4426[Class: TemplateValidator]:::cls
  N4425 --> N4426
  N4427[validate()]:::mth
  N4426 --> N4427
  N4428[validate()]:::mth
  N4426 --> N4428
  N4429[addCustomRule()]:::mth
  N4426 --> N4429
  N4430[removeCustomRule()]:::mth
  N4426 --> N4430
  N4431[getAvailableRules()]:::mth
  N4426 --> N4431
  N4432[Class: RequiredFieldsRule]:::cls
  N4425 --> N4432
  N4433[validate()]:::mth
  N4432 --> N4433
  N4434[validate()]:::mth
  N4432 --> N4434
  N4435[addCustomRule()]:::mth
  N4432 --> N4435
  N4436[removeCustomRule()]:::mth
  N4432 --> N4436
  N4437[getAvailableRules()]:::mth
  N4432 --> N4437
  N4438[Class: ResourceNamingRule]:::cls
  N4425 --> N4438
  N4439[validate()]:::mth
  N4438 --> N4439
  N4440[validate()]:::mth
  N4438 --> N4440
  N4441[addCustomRule()]:::mth
  N4438 --> N4441
  N4442[removeCustomRule()]:::mth
  N4438 --> N4442
  N4443[getAvailableRules()]:::mth
  N4438 --> N4443
  N4444[Class: DependencyValidationRule]:::cls
  N4425 --> N4444
  N4445[validate()]:::mth
  N4444 --> N4445
  N4446[validate()]:::mth
  N4444 --> N4446
  N4447[addCustomRule()]:::mth
  N4444 --> N4447
  N4448[removeCustomRule()]:::mth
  N4444 --> N4448
  N4449[getAvailableRules()]:::mth
  N4444 --> N4449
  N4450[Class: VariableValidationRule]:::cls
  N4425 --> N4450
  N4451[validate()]:::mth
  N4450 --> N4451
  N4452[validate()]:::mth
  N4450 --> N4452
  N4453[addCustomRule()]:::mth
  N4450 --> N4453
  N4454[removeCustomRule()]:::mth
  N4450 --> N4454
  N4455[getAvailableRules()]:::mth
  N4450 --> N4455
  N4456[Class: SecurityValidationRule]:::cls
  N4425 --> N4456
  N4457[validate()]:::mth
  N4456 --> N4457
  N4458[validate()]:::mth
  N4456 --> N4458
  N4459[addCustomRule()]:::mth
  N4456 --> N4459
  N4460[removeCustomRule()]:::mth
  N4456 --> N4460
  N4461[getAvailableRules()]:::mth
  N4456 --> N4461
  N4462[Class: PerformanceValidationRule]:::cls
  N4425 --> N4462
  N4463[validate()]:::mth
  N4462 --> N4463
  N4464[validate()]:::mth
  N4462 --> N4464
  N4465[addCustomRule()]:::mth
  N4462 --> N4465
  N4466[removeCustomRule()]:::mth
  N4462 --> N4466
  N4467[getAvailableRules()]:::mth
  N4462 --> N4467
  N4468[Class: CostOptimizationRule]:::cls
  N4425 --> N4468
  N4469[validate()]:::mth
  N4468 --> N4469
  N4470[validate()]:::mth
  N4468 --> N4470
  N4471[addCustomRule()]:::mth
  N4468 --> N4471
  N4472[removeCustomRule()]:::mth
  N4468 --> N4472
  N4473[getAvailableRules()]:::mth
  N4468 --> N4473
  N4474[Class: BestPracticesRule]:::cls
  N4425 --> N4474
  N4475[validate()]:::mth
  N4474 --> N4475
  N4476[validate()]:::mth
  N4474 --> N4476
  N4477[addCustomRule()]:::mth
  N4474 --> N4477
  N4478[removeCustomRule()]:::mth
  N4474 --> N4478
  N4479[getAvailableRules()]:::mth
  N4474 --> N4479
  N4481[File: GCPProvider.ts]:::file
  N4193 --> N4481
  N4482[Class: GCPProvider]:::cls
  N4481 --> N4482
  N4483[provision()]:::mth
  N4482 --> N4483
  N4484[update()]:::mth
  N4482 --> N4484
  N4485[destroy()]:::mth
  N4482 --> N4485
  N4486[import()]:::mth
  N4482 --> N4486
  N4487[getStatus()]:::mth
  N4482 --> N4487
  N4490[File: QualityGateEvaluator.ts]:::file
  N4193 --> N4490
  N4491[Class: QualityGateEvaluator]:::cls
  N4490 --> N4491
  N4492[evaluate()]:::mth
  N4491 --> N4492
  N4493[evaluateAll()]:::mth
  N4491 --> N4493
  N4494[extractValue()]:::mth
  N4491 --> N4494
  N4495[evaluateCondition()]:::mth
  N4491 --> N4495
  N4496[generateMessage()]:::mth
  N4491 --> N4496
  N4498[File: TestOrchestrator.ts]:::file
  N4193 --> N4498
  N4499[Class: TestOrchestrator]:::cls
  N4498 --> N4499
  N4500[executePlan()]:::mth
  N4499 --> N4500
  N4501[cancelPlan()]:::mth
  N4499 --> N4501
  N4502[getPlanResult()]:::mth
  N4499 --> N4502
  N4503[getAllPlanResults()]:::mth
  N4499 --> N4503
  N4504[generatePlanTemplate()]:::mth
  N4499 --> N4504
  N4505[File: TestRunner.ts]:::file
  N4193 --> N4505
  N4506[Class: TestRunner]:::cls
  N4505 --> N4506
  N4507[executeTests()]:::mth
  N4506 --> N4507
  N4508[cancelTests()]:::mth
  N4506 --> N4508
  N4509[getTestResult()]:::mth
  N4506 --> N4509
  N4510[getAllTestResults()]:::mth
  N4506 --> N4510
  N4511[generateTestSummary()]:::mth
  N4506 --> N4511
  N4515[docs]:::pkg
  TNF --> N4515
  N4516[File: api-doc-generator.service.ts]:::file
  N4515 --> N4516
  N4517[Class: ApiDocGeneratorService]:::cls
  N4516 --> N4517
  N4518[onModuleInit()]:::mth
  N4517 --> N4518
  N4519[generateDocumentation()]:::mth
  N4517 --> N4519
  N4520[buildDocumentation()]:::mth
  N4517 --> N4520
  N4521[buildDocumentationInfo()]:::mth
  N4517 --> N4521
  N4522[buildServerInfo()]:::mth
  N4517 --> N4522
  N4523[Class: ApiClient]:::cls
  N4516 --> N4523
  N4524[onModuleInit()]:::mth
  N4523 --> N4524
  N4525[generateDocumentation()]:::mth
  N4523 --> N4525
  N4526[buildDocumentation()]:::mth
  N4523 --> N4526
  N4527[buildDocumentationInfo()]:::mth
  N4523 --> N4527
  N4528[buildServerInfo()]:::mth
  N4523 --> N4528
  N4529[File: docs.controller.ts]:::file
  N4515 --> N4529
  N4530[Class: DocsController]:::cls
  N4529 --> N4530
  N4531[function()]:::mth
  N4530 --> N4531
  N4532[convertToOpenAPI()]:::mth
  N4530 --> N4532
  N4533[convertToMarkdown()]:::mth
  N4530 --> N4533
  N4534[convertToHTML()]:::mth
  N4530 --> N4534
  N4535[convertToPostman()]:::mth
  N4530 --> N4535
  N4536[Class: ApiClient]:::cls
  N4529 --> N4536
  N4537[function()]:::mth
  N4536 --> N4537
  N4538[convertToOpenAPI()]:::mth
  N4536 --> N4538
  N4539[convertToMarkdown()]:::mth
  N4536 --> N4539
  N4540[convertToHTML()]:::mth
  N4536 --> N4540
  N4541[convertToPostman()]:::mth
  N4536 --> N4541
  N4542[eslint-config-custom]:::pkg
  TNF --> N4542
  N4543[extension-core]:::pkg
  TNF --> N4543
  N4547[extension-system]:::pkg
  TNF --> N4547
  N4548[File: ExtensionLoader.ts]:::file
  N4547 --> N4548
  N4549[Class: ExtensionLoader]:::cls
  N4548 --> N4549
  N4550[load()]:::mth
  N4549 --> N4550
  N4551[File: ExtensionManager.ts]:::file
  N4547 --> N4551
  N4552[Class: for]:::cls
  N4551 --> N4552
  N4553[loadAllExtensions()]:::mth
  N4552 --> N4553
  N4554[enableExtension()]:::mth
  N4552 --> N4554
  N4555[disableExtension()]:::mth
  N4552 --> N4555
  N4556[getExtension()]:::mth
  N4552 --> N4556
  N4557[getAllExtensions()]:::mth
  N4552 --> N4557
  N4558[Class: ExtensionManager]:::cls
  N4551 --> N4558
  N4559[loadAllExtensions()]:::mth
  N4558 --> N4559
  N4560[enableExtension()]:::mth
  N4558 --> N4560
  N4561[disableExtension()]:::mth
  N4558 --> N4561
  N4562[getExtension()]:::mth
  N4558 --> N4562
  N4563[getAllExtensions()]:::mth
  N4558 --> N4563
  N4564[File: ExtensionRegistry.ts]:::file
  N4547 --> N4564
  N4565[Class: ExtensionRegistry]:::cls
  N4564 --> N4565
  N4566[discoverExtensions()]:::mth
  N4565 --> N4566
  N4567[registerExtension()]:::mth
  N4565 --> N4567
  N4568[getExtension()]:::mth
  N4565 --> N4568
  N4569[getAllExtensions()]:::mth
  N4565 --> N4569
  N4571[File: ExtensionValidator.ts]:::file
  N4547 --> N4571
  N4572[Class: ExtensionValidator]:::cls
  N4571 --> N4572
  N4573[validate()]:::mth
  N4572 --> N4573
  N4574[File: index.ts]:::file
  N4547 --> N4574
  N4575[Class: ExtensionSystemFactory]:::cls
  N4574 --> N4575
  N4576[create()]:::mth
  N4575 --> N4576
  N4577[createDefault()]:::mth
  N4575 --> N4577
  N4578[migrateNestJSModules()]:::mth
  N4575 --> N4578
  N4579[createExtensionFromModule()]:::mth
  N4575 --> N4579
  N4580[migrateWorkflowNodes()]:::mth
  N4575 --> N4580
  N4581[Class: ExtensionSystemIntegrator]:::cls
  N4574 --> N4581
  N4582[create()]:::mth
  N4581 --> N4582
  N4583[createDefault()]:::mth
  N4581 --> N4583
  N4584[migrateNestJSModules()]:::mth
  N4581 --> N4584
  N4585[createExtensionFromModule()]:::mth
  N4581 --> N4585
  N4586[migrateWorkflowNodes()]:::mth
  N4581 --> N4586
  N4587[Class: ExtensionDevelopmentUtils]:::cls
  N4574 --> N4587
  N4588[create()]:::mth
  N4587 --> N4588
  N4589[createDefault()]:::mth
  N4587 --> N4589
  N4590[migrateNestJSModules()]:::mth
  N4587 --> N4590
  N4591[createExtensionFromModule()]:::mth
  N4587 --> N4591
  N4592[migrateWorkflowNodes()]:::mth
  N4587 --> N4592
  N4593[File: ExtensionLoader.ts]:::file
  N4547 --> N4593
  N4594[Class: ExtensionLoader]:::cls
  N4593 --> N4594
  N4595[loadExtension()]:::mth
  N4594 --> N4595
  N4596[performLoad()]:::mth
  N4594 --> N4596
  N4597[loadManifest()]:::mth
  N4594 --> N4597
  N4598[convertPackageJsonToManifest()]:::mth
  N4594 --> N4598
  N4599[validateExtension()]:::mth
  N4594 --> N4599
  N4600[File: ExtensionManager.ts]:::file
  N4547 --> N4600
  N4601[Class: ExtensionManager]:::cls
  N4600 --> N4601
  N4602[initialize()]:::mth
  N4601 --> N4602
  N4603[autoDiscoverAndLoad()]:::mth
  N4601 --> N4603
  N4604[getExtension()]:::mth
  N4601 --> N4604
  N4605[getAllExtensions()]:::mth
  N4601 --> N4605
  N4606[getExtensionsByType()]:::mth
  N4601 --> N4606
  N4607[File: ExtensionRegistry.ts]:::file
  N4547 --> N4607
  N4608[Class: ExtensionRegistry]:::cls
  N4607 --> N4608
  N4609[initialize()]:::mth
  N4608 --> N4609
  N4610[registerExtension()]:::mth
  N4608 --> N4610
  N4611[unregisterExtension()]:::mth
  N4608 --> N4611
  N4612[getEntry()]:::mth
  N4608 --> N4612
  N4613[getAllEntries()]:::mth
  N4608 --> N4613
  N4615[File: ExtensionValidator.ts]:::file
  N4547 --> N4615
  N4616[Class: ExtensionValidator]:::cls
  N4615 --> N4616
  N4617[validateManifest()]:::mth
  N4616 --> N4617
  N4618[validateConfiguration()]:::mth
  N4616 --> N4618
  N4619[performSecurityScan()]:::mth
  N4616 --> N4619
  N4620[initializeValidationRules()]:::mth
  N4616 --> N4620
  N4621[initializeWarningRules()]:::mth
  N4616 --> N4621
  N4622[fairtable-adapters]:::pkg
  TNF --> N4622
  N4625[fairtable-components]:::pkg
  TNF --> N4625
  N4627[fairtable-core]:::pkg
  TNF --> N4627
  N4633[fairtable-utils]:::pkg
  TNF --> N4633
  N4637[feature-suggestions]:::pkg
  TNF --> N4637
  N4641[File: unifiedLedgerTimeline.service.ts]:::file
  N4637 --> N4641
  N4642[Class: UnifiedLedgerTimelineService]:::cls
  N4641 --> N4642
  N4643[postTimelineEvent()]:::mth
  N4642 --> N4643
  N4644[getEventTimeline()]:::mth
  N4642 --> N4644
  N4645[getBranchHierarchy()]:::mth
  N4642 --> N4645
  N4646[getWorkflowsByEvent()]:::mth
  N4642 --> N4646
  N4647[createBranch()]:::mth
  N4642 --> N4647
  N4652[feature-tracker]:::pkg
  TNF --> N4652
  N4653[File: metrics.service.ts]:::file
  N4652 --> N4653
  N4654[Class: MetricsService]:::cls
  N4653 --> N4654
  N4655[recordMetric()]:::mth
  N4654 --> N4655
  N4656[getMetrics()]:::mth
  N4654 --> N4656
  N4657[getAllMetrics()]:::mth
  N4654 --> N4657
  N4658[clearMetrics()]:::mth
  N4654 --> N4658
  N4659[clearAllMetrics()]:::mth
  N4654 --> N4659
  N4660[File: FeatureTracker.ts]:::file
  N4652 --> N4660
  N4661[Class: FeatureTracker]:::cls
  N4660 --> N4661
  N4662[createFeature()]:::mth
  N4661 --> N4662
  N4663[getFeature()]:::mth
  N4661 --> N4663
  N4664[updateStage()]:::mth
  N4661 --> N4664
  N4665[calculateCompletionPercentage()]:::mth
  N4661 --> N4665
  N4666[updateMetrics()]:::mth
  N4661 --> N4666
  N4669[File: metrics.service.ts]:::file
  N4652 --> N4669
  N4670[Class: MetricsService]:::cls
  N4669 --> N4670
  N4671[recordMetric()]:::mth
  N4670 --> N4671
  N4672[getMetrics()]:::mth
  N4670 --> N4672
  N4673[getAllMetrics()]:::mth
  N4670 --> N4673
  N4674[clearMetrics()]:::mth
  N4670 --> N4674
  N4675[clearAllMetrics()]:::mth
  N4670 --> N4675
  N4678[features]:::pkg
  TNF --> N4678
  N4715[File: WizardSystem.ts]:::file
  N4678 --> N4715
  N4716[Class: WizardStateManager]:::cls
  N4715 --> N4716
  N4717[registerWizard()]:::mth
  N4716 --> N4717
  N4718[startWizard()]:::mth
  N4716 --> N4718
  N4719[getProgress()]:::mth
  N4716 --> N4719
  N4720[getCurrentStep()]:::mth
  N4716 --> N4720
  N4721[validateCurrentStep()]:::mth
  N4716 --> N4721
  N4722[Class: WizardBuilder]:::cls
  N4715 --> N4722
  N4723[registerWizard()]:::mth
  N4722 --> N4723
  N4724[startWizard()]:::mth
  N4722 --> N4724
  N4725[getProgress()]:::mth
  N4722 --> N4725
  N4726[getCurrentStep()]:::mth
  N4722 --> N4726
  N4727[validateCurrentStep()]:::mth
  N4722 --> N4727
  N4731[gemini-browser-skill]:::pkg
  TNF --> N4731
  N4740[File: GeminiBrowserAutomation.ts]:::file
  N4731 --> N4740
  N4741[Class: GeminiBrowserAutomation]:::cls
  N4740 --> N4741
  N4742[initialize()]:::mth
  N4741 --> N4742
  N4743[openGeminiPanel()]:::mth
  N4741 --> N4743
  N4744[typePrompt()]:::mth
  N4741 --> N4744
  N4745[extractResponse()]:::mth
  N4741 --> N4745
  N4746[openContextTabs()]:::mth
  N4741 --> N4746
  N4747[File: GeminiBrowserMCPServer.ts]:::file
  N4731 --> N4747
  N4748[Class: GeminiBrowserMCPServer]:::cls
  N4747 --> N4748
  N4749[getTools()]:::mth
  N4748 --> N4749
  N4750[executeTool()]:::mth
  N4748 --> N4750
  N4751[handlePrompt()]:::mth
  N4748 --> N4751
  N4752[handleStatus()]:::mth
  N4748 --> N4752
  N4753[handleInitialize()]:::mth
  N4748 --> N4753
  N4758[File: TranscriptProcessorV2.ts]:::file
  N4731 --> N4758
  N4759[Class: TranscriptProcessorV2]:::cls
  N4758 --> N4759
  N4760[loadState()]:::mth
  N4759 --> N4760
  N4761[saveState()]:::mth
  N4759 --> N4761
  N4762[updateStats()]:::mth
  N4759 --> N4762
  N4763[extractVideoId()]:::mth
  N4759 --> N4763
  N4764[formatDuration()]:::mth
  N4759 --> N4764
  N4765[Class: contains]:::cls
  N4758 --> N4765
  N4766[loadState()]:::mth
  N4765 --> N4766
  N4767[saveState()]:::mth
  N4765 --> N4767
  N4768[updateStats()]:::mth
  N4765 --> N4768
  N4769[extractVideoId()]:::mth
  N4765 --> N4769
  N4770[formatDuration()]:::mth
  N4765 --> N4770
  N4772[google-sheets-mcp-server]:::pkg
  TNF --> N4772
  N4777[hardware-bridge]:::pkg
  TNF --> N4777
  N4778[hooks]:::pkg
  TNF --> N4778
  N4793[File: api-client.ts]:::file
  N4778 --> N4793
  N4794[Class: AgentService]:::cls
  N4793 --> N4794
  N4795[getAgents()]:::mth
  N4794 --> N4795
  N4796[getAgent()]:::mth
  N4794 --> N4796
  N4797[createAgent()]:::mth
  N4794 --> N4797
  N4798[updateAgent()]:::mth
  N4794 --> N4798
  N4799[deleteAgent()]:::mth
  N4794 --> N4799
  N4800[Class: AuthService]:::cls
  N4793 --> N4800
  N4801[getAgents()]:::mth
  N4800 --> N4801
  N4802[getAgent()]:::mth
  N4800 --> N4802
  N4803[createAgent()]:::mth
  N4800 --> N4803
  N4804[updateAgent()]:::mth
  N4800 --> N4804
  N4805[deleteAgent()]:::mth
  N4800 --> N4805
  N4806[Class: WorkflowService]:::cls
  N4793 --> N4806
  N4807[getAgents()]:::mth
  N4806 --> N4807
  N4808[getAgent()]:::mth
  N4806 --> N4808
  N4809[createAgent()]:::mth
  N4806 --> N4809
  N4810[updateAgent()]:::mth
  N4806 --> N4810
  N4811[deleteAgent()]:::mth
  N4806 --> N4811
  N4818[infrastructure]:::pkg
  TNF --> N4818
  N4823[File: UnifiedLoggingService.ts]:::file
  N4818 --> N4823
  N4824[Class: UnifiedLoggingService]:::cls
  N4823 --> N4824
  N4825[log()]:::mth
  N4824 --> N4825
  N4826[debug()]:::mth
  N4824 --> N4826
  N4827[info()]:::mth
  N4824 --> N4827
  N4828[warn()]:::mth
  N4824 --> N4828
  N4829[error()]:::mth
  N4824 --> N4829
  N4832[File: MigrationUtils.ts]:::file
  N4818 --> N4832
  N4833[Class: RedisMigrationUtils]:::cls
  N4832 --> N4833
  N4834[createLegacyWrapper()]:::mth
  N4833 --> N4834
  N4835[migrateData()]:::mth
  N4833 --> N4835
  N4836[validateMigration()]:::mth
  N4833 --> N4836
  N4837[scanKeysFromLegacy()]:::mth
  N4833 --> N4837
  N4838[File: RedisConfig.ts]:::file
  N4818 --> N4838
  N4839[Class: RedisConfig]:::cls
  N4838 --> N4839
  N4840[parseRedisConfig()]:::mth
  N4839 --> N4840
  N4841[getConfiguration()]:::mth
  N4839 --> N4841
  N4842[getUpstashConfig()]:::mth
  N4839 --> N4842
  N4843[getConnectionOptions()]:::mth
  N4839 --> N4843
  N4844[isClusterMode()]:::mth
  N4839 --> N4844
  N4845[File: RedisModule.ts]:::file
  N4818 --> N4845
  N4846[Class: RedisModule]:::cls
  N4845 --> N4846
  N4847[forRoot()]:::mth
  N4846 --> N4847
  N4849[File: UnifiedRedisService.ts]:::file
  N4818 --> N4849
  N4850[Class: UnifiedRedisService]:::cls
  N4849 --> N4850
  N4851[isConnected()]:::mth
  N4850 --> N4851
  N4852[onModuleInit()]:::mth
  N4850 --> N4852
  N4853[onModuleDestroy()]:::mth
  N4850 --> N4853
  N4854[initializeConnections()]:::mth
  N4850 --> N4854
  N4855[createDummyClient()]:::mth
  N4850 --> N4855
  N4859[File: GcsStorageService.ts]:::file
  N4818 --> N4859
  N4860[Class: GcsStorageService]:::cls
  N4859 --> N4860
  N4861[upload()]:::mth
  N4860 --> N4861
  N4862[download()]:::mth
  N4860 --> N4862
  N4863[delete()]:::mth
  N4860 --> N4863
  N4864[getMetadata()]:::mth
  N4860 --> N4864
  N4865[exists()]:::mth
  N4860 --> N4865
  N4866[File: StorageModule.ts]:::file
  N4818 --> N4866
  N4867[Class: StorageModule]:::cls
  N4866 --> N4867
  N4868[forRoot()]:::mth
  N4867 --> N4868
  N4869[File: StorageService.ts]:::file
  N4818 --> N4869
  N4870[Class: StorageService]:::cls
  N4869 --> N4870
  N4873[integration-tests]:::pkg
  TNF --> N4873
  N4878[File: complete-scenarios.test.ts]:::file
  N4873 --> N4878
  N4879[Class: UnreliableProcessor]:::cls
  N4878 --> N4879
  N4880[onLoad()]:::mth
  N4879 --> N4880
  N4881[execute()]:::mth
  N4879 --> N4881
  N4882[File: collaboration-app.ts]:::file
  N4873 --> N4882
  N4883[Class: CollaborationApp]:::cls
  N4882 --> N4883
  N4884[initialize()]:::mth
  N4883 --> N4884
  N4885[setupCollaboration()]:::mth
  N4883 --> N4885
  N4886[createCollaborationExtensions()]:::mth
  N4883 --> N4886
  N4887[registerDevelopmentTeam()]:::mth
  N4883 --> N4887
  N4888[createProjectWorkflows()]:::mth
  N4883 --> N4888
  N4889[File: data-pipeline-app.ts]:::file
  N4873 --> N4889
  N4890[Class: DataPipelineApp]:::cls
  N4889 --> N4890
  N4891[initialize()]:::mth
  N4890 --> N4891
  N4892[setupPipeline()]:::mth
  N4890 --> N4892
  N4893[createDataProcessingExtensions()]:::mth
  N4890 --> N4893
  N4894[onLoad()]:::mth
  N4890 --> N4894
  N4895[execute()]:::mth
  N4890 --> N4895
  N4896[Class: CSVParser]:::cls
  N4889 --> N4896
  N4897[initialize()]:::mth
  N4896 --> N4897
  N4898[setupPipeline()]:::mth
  N4896 --> N4898
  N4899[createDataProcessingExtensions()]:::mth
  N4896 --> N4899
  N4900[onLoad()]:::mth
  N4896 --> N4900
  N4901[execute()]:::mth
  N4896 --> N4901
  N4902[Class: DataValidator]:::cls
  N4889 --> N4902
  N4903[initialize()]:::mth
  N4902 --> N4903
  N4904[setupPipeline()]:::mth
  N4902 --> N4904
  N4905[createDataProcessingExtensions()]:::mth
  N4902 --> N4905
  N4906[onLoad()]:::mth
  N4902 --> N4906
  N4907[execute()]:::mth
  N4902 --> N4907
  N4908[Class: DataAnalytics]:::cls
  N4889 --> N4908
  N4909[initialize()]:::mth
  N4908 --> N4909
  N4910[setupPipeline()]:::mth
  N4908 --> N4910
  N4911[createDataProcessingExtensions()]:::mth
  N4908 --> N4911
  N4912[onLoad()]:::mth
  N4908 --> N4912
  N4913[execute()]:::mth
  N4908 --> N4913
  N4914[Class: ReportGenerator]:::cls
  N4889 --> N4914
  N4915[initialize()]:::mth
  N4914 --> N4915
  N4916[setupPipeline()]:::mth
  N4914 --> N4916
  N4917[createDataProcessingExtensions()]:::mth
  N4914 --> N4917
  N4918[onLoad()]:::mth
  N4914 --> N4918
  N4919[execute()]:::mth
  N4914 --> N4919
  N4920[File: extension-system.test.ts]:::file
  N4873 --> N4920
  N4921[Class: ErrorExtension]:::cls
  N4920 --> N4921
  N4922[onLoad()]:::mth
  N4921 --> N4922
  N4923[execute()]:::mth
  N4921 --> N4923
  N4928[File: agent-registry-adapter.ts]:::file
  N4873 --> N4928
  N4929[Class: AgentRegistryAdapter]:::cls
  N4928 --> N4929
  N4930[getAgent()]:::mth
  N4929 --> N4930
  N4931[agents()]:::mth
  N4929 --> N4931
  N4932[getAgent()]:::mth
  N4929 --> N4932
  N4933[getAgentCount()]:::mth
  N4929 --> N4933
  N4934[registerAgent()]:::mth
  N4929 --> N4934
  N4935[File: heartbeat-adapter.ts]:::file
  N4873 --> N4935
  N4936[Class: HeartbeatServiceAdapter]:::cls
  N4935 --> N4936
  N4937[registerAgent()]:::mth
  N4936 --> N4937
  N4938[registerAgent()]:::mth
  N4936 --> N4938
  N4939[recordActivity()]:::mth
  N4936 --> N4939
  N4942[File: canvas-interactions.test.ts]:::file
  N4873 --> N4942
  N4943[Class: class]:::cls
  N4942 --> N4943
  N4944[initialize()]:::mth
  N4943 --> N4944
  N4945[cleanup()]:::mth
  N4943 --> N4945
  N4946[addNode()]:::mth
  N4943 --> N4946
  N4947[getNodes()]:::mth
  N4943 --> N4947
  N4948[getNode()]:::mth
  N4943 --> N4948
  N4949[Class: HTMLCanvasElement]:::cls
  N4942 --> N4949
  N4950[initialize()]:::mth
  N4949 --> N4950
  N4951[cleanup()]:::mth
  N4949 --> N4951
  N4952[addNode()]:::mth
  N4949 --> N4952
  N4953[getNodes()]:::mth
  N4949 --> N4953
  N4954[getNode()]:::mth
  N4949 --> N4954
  N4955[Class: Element]:::cls
  N4942 --> N4955
  N4956[initialize()]:::mth
  N4955 --> N4956
  N4957[cleanup()]:::mth
  N4955 --> N4957
  N4958[addNode()]:::mth
  N4955 --> N4958
  N4959[getNodes()]:::mth
  N4955 --> N4959
  N4960[getNode()]:::mth
  N4955 --> N4960
  N4962[File: validation-execution.test.ts]:::file
  N4873 --> N4962
  N4963[Class: for]:::cls
  N4962 --> N4963
  N4964[initialize()]:::mth
  N4963 --> N4964
  N4965[cleanup()]:::mth
  N4963 --> N4965
  N4966[addNode()]:::mth
  N4963 --> N4966
  N4967[addConnection()]:::mth
  N4963 --> N4967
  N4968[validateWorkflow()]:::mth
  N4963 --> N4968
  N4969[Class: since]:::cls
  N4962 --> N4969
  N4970[initialize()]:::mth
  N4969 --> N4970
  N4971[cleanup()]:::mth
  N4969 --> N4971
  N4972[addNode()]:::mth
  N4969 --> N4972
  N4973[addConnection()]:::mth
  N4969 --> N4973
  N4974[validateWorkflow()]:::mth
  N4969 --> N4974
  N4975[Class: WorkflowBuilder]:::cls
  N4962 --> N4975
  N4976[initialize()]:::mth
  N4975 --> N4976
  N4977[cleanup()]:::mth
  N4975 --> N4977
  N4978[addNode()]:::mth
  N4975 --> N4978
  N4979[addConnection()]:::mth
  N4975 --> N4979
  N4980[validateWorkflow()]:::mth
  N4975 --> N4980
  N4981[File: workflow-builder.test.ts]:::file
  N4873 --> N4981
  N4982[Class: since]:::cls
  N4981 --> N4982
  N4983[startAutoSave()]:::mth
  N4982 --> N4983
  N4984[saveState()]:::mth
  N4982 --> N4984
  N4985[initialize()]:::mth
  N4982 --> N4985
  N4986[cleanup()]:::mth
  N4982 --> N4986
  N4987[loadWorkflow()]:::mth
  N4982 --> N4987
  N4988[Class: WorkflowBuilder]:::cls
  N4981 --> N4988
  N4989[startAutoSave()]:::mth
  N4988 --> N4989
  N4990[saveState()]:::mth
  N4988 --> N4990
  N4991[initialize()]:::mth
  N4988 --> N4991
  N4992[cleanup()]:::mth
  N4988 --> N4992
  N4993[loadWorkflow()]:::mth
  N4988 --> N4993
  N4994[integrations]:::pkg
  TNF --> N4994
  N4998[job-queue]:::pkg
  TNF --> N4998
  N4999[File: optimized-queue.service.ts]:::file
  N4998 --> N4999
  N5000[Class: OptimizedQueueService]:::cls
  N4999 --> N5000
  N5001[onModuleInit()]:::mth
  N5000 --> N5001
  N5002[initializeQueues()]:::mth
  N5000 --> N5002
  N5003[setupQueueEventListeners()]:::mth
  N5000 --> N5003
  N5004[addJob()]:::mth
  N5000 --> N5004
  N5005[addBatchJobs()]:::mth
  N5000 --> N5005
  N5006[jules-integration]:::pkg
  TNF --> N5006
  N5007[File: JulesAgentAdapter.ts]:::file
  N5006 --> N5007
  N5008[Class: JulesAgentAdapter]:::cls
  N5007 --> N5008
  N5009[registerJulesAgent()]:::mth
  N5008 --> N5009
  N5010[delegateTask()]:::mth
  N5008 --> N5010
  N5011[updateAgentStatus()]:::mth
  N5008 --> N5011
  N5012[getApiKey()]:::mth
  N5008 --> N5012
  N5013[buildWebhookUrl()]:::mth
  N5008 --> N5013
  N5014[File: JulesApiClient.ts]:::file
  N5006 --> N5014
  N5015[Class: JulesApiClient]:::cls
  N5014 --> N5015
  N5016[createSession()]:::mth
  N5015 --> N5016
  N5017[getSessionStatus()]:::mth
  N5015 --> N5017
  N5018[approveSession()]:::mth
  N5015 --> N5018
  N5019[cancelSession()]:::mth
  N5015 --> N5019
  N5020[File: JulesWebhookHandler.ts]:::file
  N5006 --> N5020
  N5021[Class: JulesUsageTracker]:::cls
  N5020 --> N5021
  N5022[logUsageStart()]:::mth
  N5021 --> N5022
  N5023[logUsageEnd()]:::mth
  N5021 --> N5023
  N5024[handleWebhook()]:::mth
  N5021 --> N5024
  N5025[decodeContext()]:::mth
  N5021 --> N5025
  N5026[updateSessionStatus()]:::mth
  N5021 --> N5026
  N5027[Class: JulesWebhookHandler]:::cls
  N5020 --> N5027
  N5028[logUsageStart()]:::mth
  N5027 --> N5028
  N5029[logUsageEnd()]:::mth
  N5027 --> N5029
  N5030[handleWebhook()]:::mth
  N5027 --> N5030
  N5031[decodeContext()]:::mth
  N5027 --> N5031
  N5032[updateSessionStatus()]:::mth
  N5027 --> N5032
  N5036[jules-skill]:::pkg
  TNF --> N5036
  N5037[File: client.ts]:::file
  N5036 --> N5037
  N5038[Class: JulesClient]:::cls
  N5037 --> N5038
  N5039[execute()]:::mth
  N5038 --> N5039
  N5040[isAvailable()]:::mth
  N5038 --> N5040
  N5041[getVersion()]:::mth
  N5038 --> N5041
  N5042[isLoggedIn()]:::mth
  N5038 --> N5042
  N5043[createSession()]:::mth
  N5038 --> N5043
  N5047[layout]:::pkg
  TNF --> N5047
  N5049[lpm-native]:::pkg
  TNF --> N5049
  N5050[mcp-cloud-redis-bridge]:::pkg
  TNF --> N5050
  N5051[File: RedisClient.ts]:::file
  N5050 --> N5051
  N5052[Class: CloudRedisClient]:::cls
  N5051 --> N5052
  N5053[connect()]:::mth
  N5052 --> N5053
  N5054[disconnect()]:::mth
  N5052 --> N5054
  N5055[publish()]:::mth
  N5052 --> N5055
  N5056[hGetAll()]:::mth
  N5052 --> N5056
  N5057[ensureConnected()]:::mth
  N5052 --> N5057
  N5058[File: crypto.ts]:::file
  N5050 --> N5058
  N5059[Class: SecurityService]:::cls
  N5058 --> N5059
  N5060[stableStringify()]:::mth
  N5059 --> N5060
  N5061[verifyAndDecryptSignal()]:::mth
  N5059 --> N5061
  N5062[createNodeAckSignature()]:::mth
  N5059 --> N5062
  N5063[generateNodeKeys()]:::mth
  N5059 --> N5063
  N5066[mcp-core]:::pkg
  TNF --> N5066
  N5075[File: AuditLogger.ts]:::file
  N5066 --> N5075
  N5076[Class: FileAuditStorage]:::cls
  N5075 --> N5076
  N5077[store()]:::mth
  N5076 --> N5077
  N5078[store()]:::mth
  N5076 --> N5078
  N5079[query()]:::mth
  N5076 --> N5079
  N5080[cleanup()]:::mth
  N5076 --> N5080
  N5081[getStats()]:::mth
  N5076 --> N5081
  N5082[Class: AuditLogger]:::cls
  N5075 --> N5082
  N5083[store()]:::mth
  N5082 --> N5083
  N5084[store()]:::mth
  N5082 --> N5084
  N5085[query()]:::mth
  N5082 --> N5085
  N5086[cleanup()]:::mth
  N5082 --> N5086
  N5087[getStats()]:::mth
  N5082 --> N5087
  N5088[File: AuthenticationManager.integration.test.ts]:::file
  N5066 --> N5088
  N5089[Class: MockAuthWebSocket]:::cls
  N5088 --> N5089
  N5090[validateAuthentication()]:::mth
  N5089 --> N5090
  N5091[send()]:::mth
  N5089 --> N5091
  N5092[close()]:::mth
  N5089 --> N5092
  N5093[getAuthHeaders()]:::mth
  N5089 --> N5093
  N5094[createMockWebSocket()]:::mth
  N5089 --> N5094
  N5096[File: AuthenticationManager.ts]:::file
  N5066 --> N5096
  N5097[Class: AuthenticationManager]:::cls
  N5096 --> N5097
  N5098[authenticateConnection()]:::mth
  N5097 --> N5098
  N5099[authorizeRequest()]:::mth
  N5097 --> N5099
  N5100[refreshToken()]:::mth
  N5097 --> N5100
  N5101[revokeToken()]:::mth
  N5097 --> N5101
  N5102[addPolicy()]:::mth
  N5097 --> N5102
  N5104[File: PermissionValidator.ts]:::file
  N5066 --> N5104
  N5105[Class: PermissionValidator]:::cls
  N5104 --> N5105
  N5106[validateOperation()]:::mth
  N5105 --> N5106
  N5107[validateResourceAccess()]:::mth
  N5105 --> N5107
  N5108[validateToolExecution()]:::mth
  N5105 --> N5108
  N5109[validateServerAdmin()]:::mth
  N5105 --> N5109
  N5110[validateBrokerOperation()]:::mth
  N5105 --> N5110
  N5112[File: RBACManager.ts]:::file
  N5066 --> N5112
  N5113[Class: RBACManager]:::cls
  N5112 --> N5113
  N5114[createPermission()]:::mth
  N5113 --> N5114
  N5115[createRole()]:::mth
  N5113 --> N5115
  N5116[createPolicy()]:::mth
  N5113 --> N5116
  N5117[assignRolesToUser()]:::mth
  N5113 --> N5117
  N5118[getUserRoles()]:::mth
  N5113 --> N5118
  N5122[File: EventSubscriptionManager.ts]:::file
  N5066 --> N5122
  N5123[Class: EventSubscriptionManager]:::cls
  N5122 --> N5123
  N5124[start()]:::mth
  N5123 --> N5124
  N5125[stop()]:::mth
  N5123 --> N5125
  N5126[subscribe()]:::mth
  N5123 --> N5126
  N5127[unsubscribe()]:::mth
  N5123 --> N5127
  N5128[unsubscribeService()]:::mth
  N5123 --> N5128
  N5129[File: HealthMonitor.ts]:::file
  N5066 --> N5129
  N5130[Class: for]:::cls
  N5129 --> N5130
  N5131[start()]:::mth
  N5130 --> N5131
  N5132[stop()]:::mth
  N5130 --> N5132
  N5133[addService()]:::mth
  N5130 --> N5133
  N5134[removeService()]:::mth
  N5130 --> N5134
  N5135[getServiceHealth()]:::mth
  N5130 --> N5135
  N5136[Class: HealthMonitor]:::cls
  N5129 --> N5136
  N5137[start()]:::mth
  N5136 --> N5137
  N5138[stop()]:::mth
  N5136 --> N5138
  N5139[addService()]:::mth
  N5136 --> N5139
  N5140[removeService()]:::mth
  N5136 --> N5140
  N5141[getServiceHealth()]:::mth
  N5136 --> N5141
  N5142[File: LoadBalancer.test.ts]:::file
  N5066 --> N5142
  N5143[Class: covering]:::cls
  N5142 --> N5143
  N5144[File: LoadBalancer.ts]:::file
  N5066 --> N5144
  N5145[Class: for]:::cls
  N5144 --> N5145
  N5146[addService()]:::mth
  N5145 --> N5146
  N5147[removeService()]:::mth
  N5145 --> N5147
  N5148[updateService()]:::mth
  N5145 --> N5148
  N5149[markServiceHealthy()]:::mth
  N5145 --> N5149
  N5150[markServiceUnhealthy()]:::mth
  N5145 --> N5150
  N5151[Class: LoadBalancer]:::cls
  N5144 --> N5151
  N5152[addService()]:::mth
  N5151 --> N5152
  N5153[removeService()]:::mth
  N5151 --> N5153
  N5154[updateService()]:::mth
  N5151 --> N5154
  N5155[markServiceHealthy()]:::mth
  N5151 --> N5155
  N5156[markServiceUnhealthy()]:::mth
  N5151 --> N5156
  N5157[File: MCPBroker.test.ts]:::file
  N5066 --> N5157
  N5158[Class: covering]:::cls
  N5157 --> N5158
  N5159[File: MCPBroker.ts]:::file
  N5066 --> N5159
  N5160[Class: implementing]:::cls
  N5159 --> N5160
  N5161[start()]:::mth
  N5160 --> N5161
  N5162[stop()]:::mth
  N5160 --> N5162
  N5163[isRunning()]:::mth
  N5160 --> N5163
  N5164[registerService()]:::mth
  N5160 --> N5164
  N5165[unregisterService()]:::mth
  N5160 --> N5165
  N5166[Class: MCPBroker]:::cls
  N5159 --> N5166
  N5167[start()]:::mth
  N5166 --> N5167
  N5168[stop()]:::mth
  N5166 --> N5168
  N5169[isRunning()]:::mth
  N5166 --> N5169
  N5170[registerService()]:::mth
  N5166 --> N5170
  N5171[unregisterService()]:::mth
  N5166 --> N5171
  N5172[File: MessageQueue.ts]:::file
  N5066 --> N5172
  N5173[Class: for]:::cls
  N5172 --> N5173
  N5174[start()]:::mth
  N5173 --> N5174
  N5175[stop()]:::mth
  N5173 --> N5175
  N5176[enqueueMessage()]:::mth
  N5173 --> N5176
  N5177[dequeueMessagesForService()]:::mth
  N5173 --> N5177
  N5178[markMessageProcessing()]:::mth
  N5173 --> N5178
  N5179[Class: MessageQueue]:::cls
  N5172 --> N5179
  N5180[start()]:::mth
  N5179 --> N5180
  N5181[stop()]:::mth
  N5179 --> N5181
  N5182[enqueueMessage()]:::mth
  N5179 --> N5182
  N5183[dequeueMessagesForService()]:::mth
  N5179 --> N5183
  N5184[markMessageProcessing()]:::mth
  N5179 --> N5184
  N5186[File: MessageRouter.test.ts]:::file
  N5066 --> N5186
  N5187[Class: covering]:::cls
  N5186 --> N5187
  N5188[File: MessageRouter.ts]:::file
  N5066 --> N5188
  N5189[Class: for]:::cls
  N5188 --> N5189
  N5190[start()]:::mth
  N5189 --> N5190
  N5191[stop()]:::mth
  N5189 --> N5191
  N5192[routeRequest()]:::mth
  N5189 --> N5192
  N5193[broadcastNotification()]:::mth
  N5189 --> N5193
  N5194[routeNotification()]:::mth
  N5189 --> N5194
  N5195[Class: MessageRouter]:::cls
  N5188 --> N5195
  N5196[start()]:::mth
  N5195 --> N5196
  N5197[stop()]:::mth
  N5195 --> N5197
  N5198[routeRequest()]:::mth
  N5195 --> N5198
  N5199[broadcastNotification()]:::mth
  N5195 --> N5199
  N5200[routeNotification()]:::mth
  N5195 --> N5200
  N5202[File: ServiceRegistry.ts]:::file
  N5066 --> N5202
  N5203[Class: for]:::cls
  N5202 --> N5203
  N5204[start()]:::mth
  N5203 --> N5204
  N5205[stop()]:::mth
  N5203 --> N5205
  N5206[register()]:::mth
  N5203 --> N5206
  N5207[unregister()]:::mth
  N5203 --> N5207
  N5208[get()]:::mth
  N5203 --> N5208
  N5209[Class: ServiceRegistry]:::cls
  N5202 --> N5209
  N5210[start()]:::mth
  N5209 --> N5210
  N5211[stop()]:::mth
  N5209 --> N5211
  N5212[register()]:::mth
  N5209 --> N5212
  N5213[unregister()]:::mth
  N5209 --> N5213
  N5214[get()]:::mth
  N5209 --> N5214
  N5216[File: ClientCache.ts]:::file
  N5066 --> N5216
  N5217[Class: ClientCache]:::cls
  N5216 --> N5217
  N5218[cacheResource()]:::mth
  N5217 --> N5218
  N5219[getResource()]:::mth
  N5217 --> N5219
  N5220[cacheCapabilities()]:::mth
  N5217 --> N5220
  N5221[getCapabilities()]:::mth
  N5217 --> N5221
  N5222[cacheToolResult()]:::mth
  N5217 --> N5222
  N5223[File: ClientResourceToolAccess.test.ts]:::file
  N5066 --> N5223
  N5224[Class: MockCloseEvent]:::cls
  N5223 --> N5224
  N5225[setupDefaultHandlers()]:::mth
  N5224 --> N5225
  N5226[send()]:::mth
  N5224 --> N5226
  N5227[close()]:::mth
  N5224 --> N5227
  N5228[Class: MockWebSocket]:::cls
  N5223 --> N5228
  N5229[setupDefaultHandlers()]:::mth
  N5228 --> N5229
  N5230[send()]:::mth
  N5228 --> N5230
  N5231[close()]:::mth
  N5228 --> N5231
  N5232[File: ConnectionManager.integration.test.ts]:::file
  N5066 --> N5232
  N5233[Class: MockSecureWebSocket]:::cls
  N5232 --> N5233
  N5234[send()]:::mth
  N5233 --> N5234
  N5235[close()]:::mth
  N5233 --> N5235
  N5236[getAuthHeaders()]:::mth
  N5233 --> N5236
  N5237[getTLSOptions()]:::mth
  N5233 --> N5237
  N5238[send()]:::mth
  N5233 --> N5238
  N5239[Class: TLSFailureWebSocket]:::cls
  N5232 --> N5239
  N5240[send()]:::mth
  N5239 --> N5240
  N5241[close()]:::mth
  N5239 --> N5241
  N5242[getAuthHeaders()]:::mth
  N5239 --> N5242
  N5243[getTLSOptions()]:::mth
  N5239 --> N5243
  N5244[send()]:::mth
  N5239 --> N5244
  N5245[Class: AuthFailureWebSocket]:::cls
  N5232 --> N5245
  N5246[send()]:::mth
  N5245 --> N5246
  N5247[close()]:::mth
  N5245 --> N5247
  N5248[getAuthHeaders()]:::mth
  N5245 --> N5248
  N5249[getTLSOptions()]:::mth
  N5245 --> N5249
  N5250[send()]:::mth
  N5245 --> N5250
  N5251[File: ConnectionManager.test.ts]:::file
  N5066 --> N5251
  N5252[Class: MockWebSocket]:::cls
  N5251 --> N5252
  N5253[send()]:::mth
  N5252 --> N5253
  N5254[close()]:::mth
  N5252 --> N5254
  N5255[send()]:::mth
  N5252 --> N5255
  N5256[close()]:::mth
  N5252 --> N5256
  N5257[send()]:::mth
  N5252 --> N5257
  N5258[Class: TimeoutWebSocket]:::cls
  N5251 --> N5258
  N5259[send()]:::mth
  N5258 --> N5259
  N5260[close()]:::mth
  N5258 --> N5260
  N5261[send()]:::mth
  N5258 --> N5261
  N5262[close()]:::mth
  N5258 --> N5262
  N5263[send()]:::mth
  N5258 --> N5263
  N5264[Class: RetryWebSocket]:::cls
  N5251 --> N5264
  N5265[send()]:::mth
  N5264 --> N5265
  N5266[close()]:::mth
  N5264 --> N5266
  N5267[send()]:::mth
  N5264 --> N5267
  N5268[close()]:::mth
  N5264 --> N5268
  N5269[send()]:::mth
  N5264 --> N5269
  N5270[Class: FailingWebSocket]:::cls
  N5251 --> N5270
  N5271[send()]:::mth
  N5270 --> N5271
  N5272[close()]:::mth
  N5270 --> N5272
  N5273[send()]:::mth
  N5270 --> N5273
  N5274[close()]:::mth
  N5270 --> N5274
  N5275[send()]:::mth
  N5270 --> N5275
  N5276[Class: ErrorWebSocket]:::cls
  N5251 --> N5276
  N5277[send()]:::mth
  N5276 --> N5277
  N5278[close()]:::mth
  N5276 --> N5278
  N5279[send()]:::mth
  N5276 --> N5279
  N5280[close()]:::mth
  N5276 --> N5280
  N5281[send()]:::mth
  N5276 --> N5281
  N5282[File: ConnectionManager.ts]:::file
  N5066 --> N5282
  N5283[Class: WebSocketMCPConnection]:::cls
  N5282 --> N5283
  N5284[connect()]:::mth
  N5283 --> N5284
  N5285[WebSocket()]:::mth
  N5283 --> N5285
  N5286[send()]:::mth
  N5283 --> N5286
  N5287[close()]:::mth
  N5283 --> N5287
  N5288[isActive()]:::mth
  N5283 --> N5288
  N5289[Class: ConnectionManager]:::cls
  N5282 --> N5289
  N5290[connect()]:::mth
  N5289 --> N5290
  N5291[WebSocket()]:::mth
  N5289 --> N5291
  N5292[send()]:::mth
  N5289 --> N5292
  N5293[close()]:::mth
  N5289 --> N5293
  N5294[isActive()]:::mth
  N5289 --> N5294
  N5295[File: EventManager.ts]:::file
  N5066 --> N5295
  N5296[Class: EventManager]:::cls
  N5295 --> N5296
  N5297[subscribe()]:::mth
  N5296 --> N5297
  N5298[subscribeToMethod()]:::mth
  N5296 --> N5298
  N5299[subscribeToPattern()]:::mth
  N5296 --> N5299
  N5300[subscribeToAll()]:::mth
  N5296 --> N5300
  N5301[subscribeOnce()]:::mth
  N5296 --> N5301
  N5302[File: MCPClient.integration.test.ts]:::file
  N5066 --> N5302
  N5303[Class: TestResourceHandler]:::cls
  N5302 --> N5303
  N5304[read()]:::mth
  N5303 --> N5304
  N5305[list()]:::mth
  N5303 --> N5305
  N5306[execute()]:::mth
  N5303 --> N5306
  N5307[validate()]:::mth
  N5303 --> N5307
  N5308[Class: TestToolHandler]:::cls
  N5302 --> N5308
  N5309[read()]:::mth
  N5308 --> N5309
  N5310[list()]:::mth
  N5308 --> N5310
  N5311[execute()]:::mth
  N5308 --> N5311
  N5312[validate()]:::mth
  N5308 --> N5312
  N5313[File: MCPClient.test.ts]:::file
  N5066 --> N5313
  N5314[Class: MockCloseEvent]:::cls
  N5313 --> N5314
  N5315[send()]:::mth
  N5314 --> N5315
  N5316[close()]:::mth
  N5314 --> N5316
  N5317[send()]:::mth
  N5314 --> N5317
  N5318[Class: MockWebSocket]:::cls
  N5313 --> N5318
  N5319[send()]:::mth
  N5318 --> N5319
  N5320[close()]:::mth
  N5318 --> N5320
  N5321[send()]:::mth
  N5318 --> N5321
  N5322[Class: extends]:::cls
  N5313 --> N5322
  N5323[send()]:::mth
  N5322 --> N5323
  N5324[close()]:::mth
  N5322 --> N5324
  N5325[send()]:::mth
  N5322 --> N5325
  N5326[Class: extends]:::cls
  N5313 --> N5326
  N5327[send()]:::mth
  N5326 --> N5327
  N5328[close()]:::mth
  N5326 --> N5328
  N5329[send()]:::mth
  N5326 --> N5329
  N5330[Class: extends]:::cls
  N5313 --> N5330
  N5331[send()]:::mth
  N5330 --> N5331
  N5332[close()]:::mth
  N5330 --> N5332
  N5333[send()]:::mth
  N5330 --> N5333
  N5334[File: MCPClient.ts]:::file
  N5066 --> N5334
  N5335[Class: that]:::cls
  N5334 --> N5335
  N5336[setupEventHandlers()]:::mth
  N5335 --> N5336
  N5337[connect()]:::mth
  N5335 --> N5337
  N5338[disconnect()]:::mth
  N5335 --> N5338
  N5339[sendRequest()]:::mth
  N5335 --> N5339
  N5340[subscribeToNotifications()]:::mth
  N5335 --> N5340
  N5341[Class: MCPClient]:::cls
  N5334 --> N5341
  N5342[setupEventHandlers()]:::mth
  N5341 --> N5342
  N5343[connect()]:::mth
  N5341 --> N5343
  N5344[disconnect()]:::mth
  N5341 --> N5344
  N5345[sendRequest()]:::mth
  N5341 --> N5345
  N5346[subscribeToNotifications()]:::mth
  N5341 --> N5346
  N5347[File: RequestManager.ts]:::file
  N5066 --> N5347
  N5348[Class: RequestManager]:::cls
  N5347 --> N5348
  N5349[setConnection()]:::mth
  N5348 --> N5349
  N5350[sendRequest()]:::mth
  N5348 --> N5350
  N5351[sendNotification()]:::mth
  N5348 --> N5351
  N5352[handleMessage()]:::mth
  N5348 --> N5352
  N5353[handleDisconnection()]:::mth
  N5348 --> N5353
  N5356[File: CircuitBreaker.ts]:::file
  N5066 --> N5356
  N5357[Class: CircuitBreaker]:::cls
  N5356 --> N5357
  N5358[getStats()]:::mth
  N5357 --> N5358
  N5359[reset()]:::mth
  N5357 --> N5359
  N5360[getName()]:::mth
  N5357 --> N5360
  N5361[getState()]:::mth
  N5357 --> N5361
  N5362[isHealthy()]:::mth
  N5357 --> N5362
  N5363[Class: CircuitBreakerManager]:::cls
  N5356 --> N5363
  N5364[getStats()]:::mth
  N5363 --> N5364
  N5365[reset()]:::mth
  N5363 --> N5365
  N5366[getName()]:::mth
  N5363 --> N5366
  N5367[getState()]:::mth
  N5363 --> N5367
  N5368[isHealthy()]:::mth
  N5363 --> N5368
  N5370[File: ErrorMonitor.ts]:::file
  N5066 --> N5370
  N5371[Class: ErrorMonitor]:::cls
  N5370 --> N5371
  N5372[recordError()]:::mth
  N5371 --> N5372
  N5373[getCurrentMetrics()]:::mth
  N5371 --> N5373
  N5374[getMetricsHistory()]:::mth
  N5371 --> N5374
  N5375[registerAlertRule()]:::mth
  N5371 --> N5375
  N5376[removeAlertRule()]:::mth
  N5371 --> N5376
  N5377[File: FailoverManager.ts]:::file
  N5066 --> N5377
  N5378[Class: FailoverManager]:::cls
  N5377 --> N5378
  N5379[addEndpoint()]:::mth
  N5378 --> N5379
  N5380[removeEndpoint()]:::mth
  N5378 --> N5380
  N5381[getStats()]:::mth
  N5378 --> N5381
  N5382[getEndpoints()]:::mth
  N5378 --> N5382
  N5383[getHealthyEndpoints()]:::mth
  N5378 --> N5383
  N5384[File: GracefulDegradation.ts]:::file
  N5066 --> N5384
  N5385[Class: GracefulDegradationManager]:::cls
  N5384 --> N5385
  N5386[registerFallbackHandler()]:::mth
  N5385 --> N5386
  N5387[getServiceStatus()]:::mth
  N5385 --> N5387
  N5388[degradeToLevel()]:::mth
  N5385 --> N5388
  N5389[attemptRecovery()]:::mth
  N5385 --> N5389
  N5390[forceFullService()]:::mth
  N5385 --> N5390
  N5392[File: MCPErrorHandler.ts]:::file
  N5066 --> N5392
  N5393[Class: MCPErrorHandler]:::cls
  N5392 --> N5393
  N5394[handleError()]:::mth
  N5393 --> N5394
  N5395[registerRecoveryStrategy()]:::mth
  N5393 --> N5395
  N5396[registerErrorHandler()]:::mth
  N5393 --> N5396
  N5397[getStatistics()]:::mth
  N5393 --> N5397
  N5398[getErrorHistory()]:::mth
  N5393 --> N5398
  N5399[Class: ErrorHandlerFactory]:::cls
  N5392 --> N5399
  N5400[handleError()]:::mth
  N5399 --> N5400
  N5401[registerRecoveryStrategy()]:::mth
  N5399 --> N5401
  N5402[registerErrorHandler()]:::mth
  N5399 --> N5402
  N5403[getStatistics()]:::mth
  N5399 --> N5403
  N5404[getErrorHistory()]:::mth
  N5399 --> N5404
  N5405[File: MCPUnifiedErrorHandler.ts]:::file
  N5066 --> N5405
  N5406[Class: MCPUnifiedErrorHandler]:::cls
  N5405 --> N5406
  N5407[initializeDefaultRecoveryStrategies()]:::mth
  N5406 --> N5407
  N5408[initializeDefaultErrorHandlers()]:::mth
  N5406 --> N5408
  N5409[createMCPError()]:::mth
  N5406 --> N5409
  N5410[handleConnectionError()]:::mth
  N5406 --> N5410
  N5411[handleResourceError()]:::mth
  N5406 --> N5411
  N5415[File: MCPSystemFactory.ts]:::file
  N5066 --> N5415
  N5416[Class: MCPSystemImpl]:::cls
  N5415 --> N5416
  N5417[start()]:::mth
  N5416 --> N5417
  N5418[initializeComponents()]:::mth
  N5416 --> N5418
  N5419[start()]:::mth
  N5416 --> N5419
  N5420[stop()]:::mth
  N5416 --> N5420
  N5421[getHealth()]:::mth
  N5416 --> N5421
  N5422[Class: MCPSystemFactory]:::cls
  N5415 --> N5422
  N5423[start()]:::mth
  N5422 --> N5423
  N5424[initializeComponents()]:::mth
  N5422 --> N5424
  N5425[start()]:::mth
  N5422 --> N5425
  N5426[stop()]:::mth
  N5422 --> N5426
  N5427[getHealth()]:::mth
  N5422 --> N5427
  N5429[File: ResourceHandler.test.ts]:::file
  N5066 --> N5429
  N5430[Class: class]:::cls
  N5429 --> N5430
  N5431[read()]:::mth
  N5430 --> N5431
  N5432[File: ResourceHandler.ts]:::file
  N5066 --> N5432
  N5433[Class: for]:::cls
  N5432 --> N5433
  N5434[read()]:::mth
  N5433 --> N5434
  N5435[validateUri()]:::mth
  N5433 --> N5435
  N5436[createResourceContent()]:::mth
  N5433 --> N5436
  N5437[handleResourceError()]:::mth
  N5433 --> N5437
  N5438[getHandlerInfo()]:::mth
  N5433 --> N5438
  N5439[Class: for]:::cls
  N5432 --> N5439
  N5440[read()]:::mth
  N5439 --> N5440
  N5441[validateUri()]:::mth
  N5439 --> N5441
  N5442[createResourceContent()]:::mth
  N5439 --> N5442
  N5443[handleResourceError()]:::mth
  N5439 --> N5443
  N5444[getHandlerInfo()]:::mth
  N5439 --> N5444
  N5445[Class: ResourceHandler]:::cls
  N5432 --> N5445
  N5446[read()]:::mth
  N5445 --> N5446
  N5447[validateUri()]:::mth
  N5445 --> N5447
  N5448[createResourceContent()]:::mth
  N5445 --> N5448
  N5449[handleResourceError()]:::mth
  N5445 --> N5449
  N5450[getHandlerInfo()]:::mth
  N5445 --> N5450
  N5451[Class: FileResourceHandler]:::cls
  N5432 --> N5451
  N5452[read()]:::mth
  N5451 --> N5452
  N5453[validateUri()]:::mth
  N5451 --> N5453
  N5454[createResourceContent()]:::mth
  N5451 --> N5454
  N5455[handleResourceError()]:::mth
  N5451 --> N5455
  N5456[getHandlerInfo()]:::mth
  N5451 --> N5456
  N5457[Class: DatabaseResourceHandler]:::cls
  N5432 --> N5457
  N5458[read()]:::mth
  N5457 --> N5458
  N5459[validateUri()]:::mth
  N5457 --> N5459
  N5460[createResourceContent()]:::mth
  N5457 --> N5460
  N5461[handleResourceError()]:::mth
  N5457 --> N5461
  N5462[getHandlerInfo()]:::mth
  N5457 --> N5462
  N5463[File: ResourceManager.integration.test.ts]:::file
  N5066 --> N5463
  N5464[Class: MockIntegrationResourceHandler]:::cls
  N5463 --> N5464
  N5465[read()]:::mth
  N5464 --> N5465
  N5466[list()]:::mth
  N5464 --> N5466
  N5467[updateContent()]:::mth
  N5464 --> N5467
  N5468[File: ResourceManager.test.ts]:::file
  N5066 --> N5468
  N5469[Class: MockResourceHandler]:::cls
  N5468 --> N5469
  N5470[read()]:::mth
  N5469 --> N5470
  N5471[list()]:::mth
  N5469 --> N5471
  N5472[read()]:::mth
  N5469 --> N5472
  N5473[File: ResourceManager.ts]:::file
  N5066 --> N5473
  N5474[Class: for]:::cls
  N5473 --> N5474
  N5475[registerResource()]:::mth
  N5474 --> N5475
  N5476[unregisterResource()]:::mth
  N5474 --> N5476
  N5477[discoverResources()]:::mth
  N5474 --> N5477
  N5478[readResource()]:::mth
  N5474 --> N5478
  N5479[listResources()]:::mth
  N5474 --> N5479
  N5480[Class: ResourceManager]:::cls
  N5473 --> N5480
  N5481[registerResource()]:::mth
  N5480 --> N5481
  N5482[unregisterResource()]:::mth
  N5480 --> N5482
  N5483[discoverResources()]:::mth
  N5480 --> N5483
  N5484[readResource()]:::mth
  N5480 --> N5484
  N5485[listResources()]:::mth
  N5480 --> N5485
  N5486[File: ToolExecutionEngine.integration.test.ts]:::file
  N5066 --> N5486
  N5487[Class: SecureFileHandler]:::cls
  N5486 --> N5487
  N5488[execute()]:::mth
  N5487 --> N5488
  N5489[execute()]:::mth
  N5487 --> N5489
  N5490[execute()]:::mth
  N5487 --> N5490
  N5491[execute()]:::mth
  N5487 --> N5491
  N5492[execute()]:::mth
  N5487 --> N5492
  N5493[Class: NetworkToolHandler]:::cls
  N5486 --> N5493
  N5494[execute()]:::mth
  N5493 --> N5494
  N5495[execute()]:::mth
  N5493 --> N5495
  N5496[execute()]:::mth
  N5493 --> N5496
  N5497[execute()]:::mth
  N5493 --> N5497
  N5498[execute()]:::mth
  N5493 --> N5498
  N5499[Class: ResourceIntensiveHandler]:::cls
  N5486 --> N5499
  N5500[execute()]:::mth
  N5499 --> N5500
  N5501[execute()]:::mth
  N5499 --> N5501
  N5502[execute()]:::mth
  N5499 --> N5502
  N5503[execute()]:::mth
  N5499 --> N5503
  N5504[execute()]:::mth
  N5499 --> N5504
  N5505[Class: MaliciousHandler]:::cls
  N5486 --> N5505
  N5506[execute()]:::mth
  N5505 --> N5506
  N5507[execute()]:::mth
  N5505 --> N5507
  N5508[execute()]:::mth
  N5505 --> N5508
  N5509[execute()]:::mth
  N5505 --> N5509
  N5510[execute()]:::mth
  N5505 --> N5510
  N5511[File: ToolExecutionEngine.test.ts]:::file
  N5066 --> N5511
  N5512[Class: MockToolHandler]:::cls
  N5511 --> N5512
  N5513[execute()]:::mth
  N5512 --> N5513
  N5514[validate()]:::mth
  N5512 --> N5514
  N5515[execute()]:::mth
  N5512 --> N5515
  N5516[execute()]:::mth
  N5512 --> N5516
  N5517[execute()]:::mth
  N5512 --> N5517
  N5518[Class: LongRunningToolHandler]:::cls
  N5511 --> N5518
  N5519[execute()]:::mth
  N5518 --> N5519
  N5520[validate()]:::mth
  N5518 --> N5520
  N5521[execute()]:::mth
  N5518 --> N5521
  N5522[execute()]:::mth
  N5518 --> N5522
  N5523[execute()]:::mth
  N5518 --> N5523
  N5524[Class: MemoryIntensiveToolHandler]:::cls
  N5511 --> N5524
  N5525[execute()]:::mth
  N5524 --> N5525
  N5526[validate()]:::mth
  N5524 --> N5526
  N5527[execute()]:::mth
  N5524 --> N5527
  N5528[execute()]:::mth
  N5524 --> N5528
  N5529[execute()]:::mth
  N5524 --> N5529
  N5530[File: ToolExecutionEngine.ts]:::file
  N5066 --> N5530
  N5531[Class: ToolExecutionEngine]:::cls
  N5530 --> N5531
  N5532[isAllowed()]:::mth
  N5531 --> N5532
  N5533[reset()]:::mth
  N5531 --> N5533
  N5534[executeToolSecurely()]:::mth
  N5531 --> N5534
  N5535[executeToolWithLimits()]:::mth
  N5531 --> N5535
  N5536[performSecurityChecks()]:::mth
  N5531 --> N5536
  N5537[Class: for]:::cls
  N5530 --> N5537
  N5538[isAllowed()]:::mth
  N5537 --> N5538
  N5539[reset()]:::mth
  N5537 --> N5539
  N5540[executeToolSecurely()]:::mth
  N5537 --> N5540
  N5541[executeToolWithLimits()]:::mth
  N5537 --> N5541
  N5542[performSecurityChecks()]:::mth
  N5537 --> N5542
  N5543[Class: ResourceMonitor]:::cls
  N5530 --> N5543
  N5544[isAllowed()]:::mth
  N5543 --> N5544
  N5545[reset()]:::mth
  N5543 --> N5545
  N5546[executeToolSecurely()]:::mth
  N5543 --> N5546
  N5547[executeToolWithLimits()]:::mth
  N5543 --> N5547
  N5548[performSecurityChecks()]:::mth
  N5543 --> N5548
  N5549[Class: EnhancedJSONSchemaValidator]:::cls
  N5530 --> N5549
  N5550[isAllowed()]:::mth
  N5549 --> N5550
  N5551[reset()]:::mth
  N5549 --> N5551
  N5552[executeToolSecurely()]:::mth
  N5549 --> N5552
  N5553[executeToolWithLimits()]:::mth
  N5549 --> N5553
  N5554[performSecurityChecks()]:::mth
  N5549 --> N5554
  N5555[Class: ToolSecurityManager]:::cls
  N5530 --> N5555
  N5556[isAllowed()]:::mth
  N5555 --> N5556
  N5557[reset()]:::mth
  N5555 --> N5557
  N5558[executeToolSecurely()]:::mth
  N5555 --> N5558
  N5559[executeToolWithLimits()]:::mth
  N5555 --> N5559
  N5560[performSecurityChecks()]:::mth
  N5555 --> N5560
  N5561[Class: ToolSandbox]:::cls
  N5530 --> N5561
  N5562[isAllowed()]:::mth
  N5561 --> N5562
  N5563[reset()]:::mth
  N5561 --> N5563
  N5564[executeToolSecurely()]:::mth
  N5561 --> N5564
  N5565[executeToolWithLimits()]:::mth
  N5561 --> N5565
  N5566[performSecurityChecks()]:::mth
  N5561 --> N5566
  N5567[Class: ToolPerformanceMonitor]:::cls
  N5530 --> N5567
  N5568[isAllowed()]:::mth
  N5567 --> N5568
  N5569[reset()]:::mth
  N5567 --> N5569
  N5570[executeToolSecurely()]:::mth
  N5567 --> N5570
  N5571[executeToolWithLimits()]:::mth
  N5567 --> N5571
  N5572[performSecurityChecks()]:::mth
  N5567 --> N5572
  N5573[Class: InMemoryRateLimiter]:::cls
  N5530 --> N5573
  N5574[isAllowed()]:::mth
  N5573 --> N5574
  N5575[reset()]:::mth
  N5573 --> N5575
  N5576[executeToolSecurely()]:::mth
  N5573 --> N5576
  N5577[executeToolWithLimits()]:::mth
  N5573 --> N5577
  N5578[performSecurityChecks()]:::mth
  N5573 --> N5578
  N5579[File: ToolHandler.test.ts]:::file
  N5066 --> N5579
  N5580[Class: class]:::cls
  N5579 --> N5580
  N5581[execute()]:::mth
  N5580 --> N5581
  N5582[File: ToolHandler.ts]:::file
  N5066 --> N5582
  N5583[Class: for]:::cls
  N5582 --> N5583
  N5584[execute()]:::mth
  N5583 --> N5584
  N5585[getUsageStats()]:::mth
  N5583 --> N5585
  N5586[cleanup()]:::mth
  N5583 --> N5586
  N5587[executeWithValidation()]:::mth
  N5583 --> N5587
  N5588[validateAgainstSchema()]:::mth
  N5583 --> N5588
  N5589[Class: for]:::cls
  N5582 --> N5589
  N5590[execute()]:::mth
  N5589 --> N5590
  N5591[getUsageStats()]:::mth
  N5589 --> N5591
  N5592[cleanup()]:::mth
  N5589 --> N5592
  N5593[executeWithValidation()]:::mth
  N5589 --> N5593
  N5594[validateAgainstSchema()]:::mth
  N5589 --> N5594
  N5595[Class: ToolHandler]:::cls
  N5582 --> N5595
  N5596[execute()]:::mth
  N5595 --> N5596
  N5597[getUsageStats()]:::mth
  N5595 --> N5597
  N5598[cleanup()]:::mth
  N5595 --> N5598
  N5599[executeWithValidation()]:::mth
  N5595 --> N5599
  N5600[validateAgainstSchema()]:::mth
  N5595 --> N5600
  N5601[Class: FunctionToolHandler]:::cls
  N5582 --> N5601
  N5602[execute()]:::mth
  N5601 --> N5602
  N5603[getUsageStats()]:::mth
  N5601 --> N5603
  N5604[cleanup()]:::mth
  N5601 --> N5604
  N5605[executeWithValidation()]:::mth
  N5601 --> N5605
  N5606[validateAgainstSchema()]:::mth
  N5601 --> N5606
  N5607[Class: ScriptToolHandler]:::cls
  N5582 --> N5607
  N5608[execute()]:::mth
  N5607 --> N5608
  N5609[getUsageStats()]:::mth
  N5607 --> N5609
  N5610[cleanup()]:::mth
  N5607 --> N5610
  N5611[executeWithValidation()]:::mth
  N5607 --> N5611
  N5612[validateAgainstSchema()]:::mth
  N5607 --> N5612
  N5613[Class: ApiCallToolHandler]:::cls
  N5582 --> N5613
  N5614[execute()]:::mth
  N5613 --> N5614
  N5615[getUsageStats()]:::mth
  N5613 --> N5615
  N5616[cleanup()]:::mth
  N5613 --> N5616
  N5617[executeWithValidation()]:::mth
  N5613 --> N5617
  N5618[validateAgainstSchema()]:::mth
  N5613 --> N5618
  N5621[File: end-to-end.integration.test.ts]:::file
  N5066 --> N5621
  N5622[Class: MockMCPClient]:::cls
  N5621 --> N5622
  N5623[sendRequest()]:::mth
  N5622 --> N5623
  N5624[sendNotification()]:::mth
  N5622 --> N5624
  N5625[handleResponse()]:::mth
  N5622 --> N5625
  N5626[close()]:::mth
  N5622 --> N5626
  N5627[read()]:::mth
  N5622 --> N5627
  N5628[Class: TestResourceHandler]:::cls
  N5621 --> N5628
  N5629[sendRequest()]:::mth
  N5628 --> N5629
  N5630[sendNotification()]:::mth
  N5628 --> N5630
  N5631[handleResponse()]:::mth
  N5628 --> N5631
  N5632[close()]:::mth
  N5628 --> N5632
  N5633[read()]:::mth
  N5628 --> N5633
  N5634[Class: TestToolHandler]:::cls
  N5621 --> N5634
  N5635[sendRequest()]:::mth
  N5634 --> N5635
  N5636[sendNotification()]:::mth
  N5634 --> N5636
  N5637[handleResponse()]:::mth
  N5634 --> N5637
  N5638[close()]:::mth
  N5634 --> N5638
  N5639[read()]:::mth
  N5634 --> N5639
  N5642[File: MCPAgentIntegration.ts]:::file
  N5066 --> N5642
  N5643[Class: provides]:::cls
  N5642 --> N5643
  N5644[registerAgentAsMCPService()]:::mth
  N5643 --> N5644
  N5645[unregisterAgent()]:::mth
  N5643 --> N5645
  N5646[enableAgentMCPCommunication()]:::mth
  N5643 --> N5646
  N5647[disableAgentMCPCommunication()]:::mth
  N5643 --> N5647
  N5648[routeAgentMessage()]:::mth
  N5643 --> N5648
  N5649[Class: implementation]:::cls
  N5642 --> N5649
  N5650[registerAgentAsMCPService()]:::mth
  N5649 --> N5650
  N5651[unregisterAgent()]:::mth
  N5649 --> N5651
  N5652[enableAgentMCPCommunication()]:::mth
  N5649 --> N5652
  N5653[disableAgentMCPCommunication()]:::mth
  N5649 --> N5653
  N5654[routeAgentMessage()]:::mth
  N5649 --> N5654
  N5655[Class: MCPAgentIntegration]:::cls
  N5642 --> N5655
  N5656[registerAgentAsMCPService()]:::mth
  N5655 --> N5656
  N5657[unregisterAgent()]:::mth
  N5655 --> N5657
  N5658[enableAgentMCPCommunication()]:::mth
  N5655 --> N5658
  N5659[disableAgentMCPCommunication()]:::mth
  N5655 --> N5659
  N5660[routeAgentMessage()]:::mth
  N5655 --> N5660
  N5661[File: MCPCallbackHandler.ts]:::file
  N5066 --> N5661
  N5662[Class: MCPCallbackHandler]:::cls
  N5661 --> N5662
  N5663[start()]:::mth
  N5662 --> N5663
  N5664[stop()]:::mth
  N5662 --> N5664
  N5665[unregisterHandler()]:::mth
  N5662 --> N5665
  N5666[handleCallback()]:::mth
  N5662 --> N5666
  N5667[getStatistics()]:::mth
  N5662 --> N5667
  N5669[File: MCPServiceMesh.test.ts]:::file
  N5066 --> N5669
  N5670[Class: MockServiceMeshProvider]:::cls
  N5669 --> N5670
  N5671[registerService()]:::mth
  N5670 --> N5671
  N5672[unregisterService()]:::mth
  N5670 --> N5672
  N5673[discoverServices()]:::mth
  N5670 --> N5673
  N5674[getServiceHealth()]:::mth
  N5670 --> N5674
  N5675[updateServiceHealth()]:::mth
  N5670 --> N5675
  N5676[File: MCPServiceMesh.ts]:::file
  N5066 --> N5676
  N5677[Class: provides]:::cls
  N5676 --> N5677
  N5678[registerService()]:::mth
  N5677 --> N5678
  N5679[isAvailable()]:::mth
  N5677 --> N5679
  N5680[initializeStatus()]:::mth
  N5677 --> N5680
  N5681[setupEventHandlers()]:::mth
  N5677 --> N5681
  N5682[registerService()]:::mth
  N5677 --> N5682
  N5683[Class: MCPServiceMesh]:::cls
  N5676 --> N5683
  N5684[registerService()]:::mth
  N5683 --> N5684
  N5685[isAvailable()]:::mth
  N5683 --> N5685
  N5686[initializeStatus()]:::mth
  N5683 --> N5686
  N5687[setupEventHandlers()]:::mth
  N5683 --> N5687
  N5688[registerService()]:::mth
  N5683 --> N5688
  N5689[File: MCPWorkflowIntegration.integration.test.ts]:::file
  N5066 --> N5689
  N5690[Class: IntegrationMockMCPClient]:::cls
  N5689 --> N5690
  N5691[connect()]:::mth
  N5690 --> N5691
  N5692[disconnect()]:::mth
  N5690 --> N5692
  N5693[sendRequest()]:::mth
  N5690 --> N5693
  N5694[setResponse()]:::mth
  N5690 --> N5694
  N5695[setDelay()]:::mth
  N5690 --> N5695
  N5696[Class: IntegrationMockMCPBroker]:::cls
  N5689 --> N5696
  N5697[connect()]:::mth
  N5696 --> N5697
  N5698[disconnect()]:::mth
  N5696 --> N5698
  N5699[sendRequest()]:::mth
  N5696 --> N5699
  N5700[setResponse()]:::mth
  N5696 --> N5700
  N5701[setDelay()]:::mth
  N5696 --> N5701
  N5702[File: MCPWorkflowIntegration.test.ts]:::file
  N5066 --> N5702
  N5703[Class: MockMCPClient]:::cls
  N5702 --> N5703
  N5704[connect()]:::mth
  N5703 --> N5704
  N5705[disconnect()]:::mth
  N5703 --> N5705
  N5706[sendRequest()]:::mth
  N5703 --> N5706
  N5707[setResponse()]:::mth
  N5703 --> N5707
  N5708[setFailure()]:::mth
  N5703 --> N5708
  N5709[Class: MockMCPBroker]:::cls
  N5702 --> N5709
  N5710[connect()]:::mth
  N5709 --> N5710
  N5711[disconnect()]:::mth
  N5709 --> N5711
  N5712[sendRequest()]:::mth
  N5709 --> N5712
  N5713[setResponse()]:::mth
  N5709 --> N5713
  N5714[setFailure()]:::mth
  N5709 --> N5714
  N5715[File: MCPWorkflowIntegration.ts]:::file
  N5066 --> N5715
  N5716[Class: MCPWorkflowIntegration]:::cls
  N5715 --> N5716
  N5717[initialize()]:::mth
  N5716 --> N5717
  N5718[shutdown()]:::mth
  N5716 --> N5718
  N5719[executeWorkflowStep()]:::mth
  N5716 --> N5719
  N5720[delegateTask()]:::mth
  N5716 --> N5720
  N5721[trackMCPExecution()]:::mth
  N5716 --> N5721
  N5722[File: RelayBridge.ts]:::file
  N5066 --> N5722
  N5723[Class: RelayBridge]:::cls
  N5722 --> N5723
  N5724[initialize()]:::mth
  N5723 --> N5724
  N5725[start()]:::mth
  N5723 --> N5725
  N5726[stop()]:::mth
  N5723 --> N5726
  N5727[getMCPServer()]:::mth
  N5723 --> N5727
  N5728[getMCPSystem()]:::mth
  N5723 --> N5728
  N5729[File: ServiceMeshMonitor.test.ts]:::file
  N5066 --> N5729
  N5730[Class: MockServiceMeshProvider]:::cls
  N5729 --> N5730
  N5731[registerService()]:::mth
  N5730 --> N5731
  N5732[unregisterService()]:::mth
  N5730 --> N5732
  N5733[discoverServices()]:::mth
  N5730 --> N5733
  N5734[configureScaling()]:::mth
  N5730 --> N5734
  N5735[getScalingStatus()]:::mth
  N5730 --> N5735
  N5736[File: ServiceMeshMonitor.ts]:::file
  N5066 --> N5736
  N5737[Class: ServiceMeshMonitor]:::cls
  N5736 --> N5737
  N5738[initializeStatistics()]:::mth
  N5737 --> N5738
  N5739[startMonitoring()]:::mth
  N5737 --> N5739
  N5740[stopMonitoring()]:::mth
  N5737 --> N5740
  N5741[addService()]:::mth
  N5737 --> N5741
  N5742[removeService()]:::mth
  N5737 --> N5742
  N5743[File: ServiceMeshScaler.test.ts]:::file
  N5066 --> N5743
  N5744[Class: MockServiceMeshProvider]:::cls
  N5743 --> N5744
  N5745[registerService()]:::mth
  N5744 --> N5745
  N5746[unregisterService()]:::mth
  N5744 --> N5746
  N5747[discoverServices()]:::mth
  N5744 --> N5747
  N5748[getServiceHealth()]:::mth
  N5744 --> N5748
  N5749[updateServiceHealth()]:::mth
  N5744 --> N5749
  N5750[File: ServiceMeshScaler.ts]:::file
  N5066 --> N5750
  N5751[Class: ServiceMeshScaler]:::cls
  N5750 --> N5751
  N5752[initializeStatistics()]:::mth
  N5751 --> N5752
  N5753[startScaling()]:::mth
  N5751 --> N5753
  N5754[stopScaling()]:::mth
  N5751 --> N5754
  N5755[addService()]:::mth
  N5751 --> N5755
  N5756[removeService()]:::mth
  N5751 --> N5756
  N5757[File: TheiaMCPBridge.ts]:::file
  N5066 --> N5757
  N5758[Class: SkIDEancerMCPBridge]:::cls
  N5757 --> N5758
  N5759[initialize()]:::mth
  N5758 --> N5759
  N5760[start()]:::mth
  N5758 --> N5760
  N5761[stop()]:::mth
  N5758 --> N5761
  N5762[getMCPServer()]:::mth
  N5758 --> N5762
  N5763[isRunning()]:::mth
  N5758 --> N5763
  N5764[File: WorkflowExecutionMonitor.ts]:::file
  N5066 --> N5764
  N5765[Class: WorkflowExecutionMonitor]:::cls
  N5764 --> N5765
  N5766[start()]:::mth
  N5765 --> N5766
  N5767[stop()]:::mth
  N5765 --> N5767
  N5768[trackExecution()]:::mth
  N5765 --> N5768
  N5769[updateExecutionStatus()]:::mth
  N5765 --> N5769
  N5770[handleCallback()]:::mth
  N5765 --> N5770
  N5771[File: database.ts]:::file
  N5066 --> N5771
  N5772[Class: DatabaseIntegrationFactory]:::cls
  N5771 --> N5772
  N5773[initialize()]:::mth
  N5772 --> N5773
  N5774[saveServiceInfo()]:::mth
  N5772 --> N5774
  N5775[getServiceInfo()]:::mth
  N5772 --> N5775
  N5776[getAllServices()]:::mth
  N5772 --> N5776
  N5777[deleteService()]:::mth
  N5772 --> N5777
  N5778[File: index.ts]:::file
  N5066 --> N5778
  N5779[Class: PlatformIntegrationManager]:::cls
  N5778 --> N5779
  N5780[getInstance()]:::mth
  N5779 --> N5780
  N5781[initialize()]:::mth
  N5779 --> N5781
  N5782[registerService()]:::mth
  N5779 --> N5782
  N5783[getStatus()]:::mth
  N5779 --> N5783
  N5784[isPlatformEnvironment()]:::mth
  N5779 --> N5784
  N5786[File: KubernetesServiceMeshProvider.ts]:::file
  N5066 --> N5786
  N5787[Class: KubernetesServiceMeshProvider]:::cls
  N5786 --> N5787
  N5788[initializeKubernetesClient()]:::mth
  N5787 --> N5788
  N5789[registerService()]:::mth
  N5787 --> N5789
  N5790[unregisterService()]:::mth
  N5787 --> N5790
  N5791[discoverServices()]:::mth
  N5787 --> N5791
  N5792[getServiceHealth()]:::mth
  N5787 --> N5792
  N5793[File: relay-core.ts]:::file
  N5066 --> N5793
  N5794[Class: RelayIntegrationFactory]:::cls
  N5793 --> N5794
  N5795[registerMCPService()]:::mth
  N5794 --> N5795
  N5796[unregisterMCPService()]:::mth
  N5794 --> N5796
  N5797[getSharedConfig()]:::mth
  N5794 --> N5797
  N5798[sendMessage()]:::mth
  N5794 --> N5798
  N5799[publishEvent()]:::mth
  N5794 --> N5799
  N5815[File: AlertManager.ts]:::file
  N5066 --> N5815
  N5816[Class: AlertManager]:::cls
  N5815 --> N5816
  N5817[start()]:::mth
  N5816 --> N5817
  N5818[stop()]:::mth
  N5816 --> N5818
  N5819[registerAlertRule()]:::mth
  N5816 --> N5819
  N5820[removeAlertRule()]:::mth
  N5816 --> N5820
  N5821[getAlertRules()]:::mth
  N5816 --> N5821
  N5822[File: CacheMonitor.ts]:::file
  N5066 --> N5822
  N5823[Class: CacheMonitor]:::cls
  N5822 --> N5823
  N5824[recordCacheHit()]:::mth
  N5823 --> N5824
  N5825[recordCacheMiss()]:::mth
  N5823 --> N5825
  N5826[recordCacheEviction()]:::mth
  N5823 --> N5826
  N5827[getCacheMetrics()]:::mth
  N5823 --> N5827
  N5828[getCacheStatistics()]:::mth
  N5823 --> N5828
  N5829[File: ConnectionPoolMonitor.ts]:::file
  N5066 --> N5829
  N5830[Class: ConnectionPoolMonitor]:::cls
  N5829 --> N5830
  N5831[recordConnectionCreated()]:::mth
  N5830 --> N5831
  N5832[recordConnectionDestroyed()]:::mth
  N5830 --> N5832
  N5833[recordConnectionAcquired()]:::mth
  N5830 --> N5833
  N5834[recordConnectionReleased()]:::mth
  N5830 --> N5834
  N5835[recordPendingRequest()]:::mth
  N5830 --> N5835
  N5836[File: DashboardManager.ts]:::file
  N5066 --> N5836
  N5837[Class: DashboardManager]:::cls
  N5836 --> N5837
  N5838[createDashboard()]:::mth
  N5837 --> N5838
  N5839[updateDashboard()]:::mth
  N5837 --> N5839
  N5840[deleteDashboard()]:::mth
  N5837 --> N5840
  N5841[getDashboard()]:::mth
  N5837 --> N5841
  N5842[listDashboards()]:::mth
  N5837 --> N5842
  N5843[File: LoadTester.ts]:::file
  N5066 --> N5843
  N5844[Class: LoadTester]:::cls
  N5843 --> N5844
  N5845[runLoadTest()]:::mth
  N5844 --> N5845
  N5846[getRunningTests()]:::mth
  N5844 --> N5846
  N5847[stopTest()]:::mth
  N5844 --> N5847
  N5848[getTestHistory()]:::mth
  N5844 --> N5848
  N5849[generateTestReport()]:::mth
  N5844 --> N5849
  N5850[Class: LoadTestExecution]:::cls
  N5843 --> N5850
  N5851[runLoadTest()]:::mth
  N5850 --> N5851
  N5852[getRunningTests()]:::mth
  N5850 --> N5852
  N5853[stopTest()]:::mth
  N5850 --> N5853
  N5854[getTestHistory()]:::mth
  N5850 --> N5854
  N5855[generateTestReport()]:::mth
  N5850 --> N5855
  N5856[Class: LoadTestWorker]:::cls
  N5843 --> N5856
  N5857[runLoadTest()]:::mth
  N5856 --> N5857
  N5858[getRunningTests()]:::mth
  N5856 --> N5858
  N5859[stopTest()]:::mth
  N5856 --> N5859
  N5860[getTestHistory()]:::mth
  N5856 --> N5860
  N5861[generateTestReport()]:::mth
  N5856 --> N5861
  N5862[File: MCPMetricsCollector.ts]:::file
  N5066 --> N5862
  N5863[Class: MCPMetricsCollector]:::cls
  N5862 --> N5863
  N5864[getCurrentMetrics()]:::mth
  N5863 --> N5864
  N5865[collectMetrics()]:::mth
  N5863 --> N5865
  N5866[recordRequestStart()]:::mth
  N5863 --> N5866
  N5867[recordRequestEnd()]:::mth
  N5863 --> N5867
  N5868[recordConnectionEvent()]:::mth
  N5863 --> N5868
  N5869[File: MCPMonitoringSystem.ts]:::file
  N5066 --> N5869
  N5870[Class: MCPMonitoringSystem]:::cls
  N5869 --> N5870
  N5871[createMetricsCollector()]:::mth
  N5870 --> N5871
  N5872[formatPrometheusMetrics()]:::mth
  N5870 --> N5872
  N5873[getMCPStatus()]:::mth
  N5870 --> N5873
  N5874[recordConnectionEvent()]:::mth
  N5870 --> N5874
  N5875[recordResourceAccess()]:::mth
  N5870 --> N5875
  N5877[File: MetricsCollector.ts]:::file
  N5066 --> N5877
  N5878[Class: MetricsCollector]:::cls
  N5877 --> N5878
  N5879[start()]:::mth
  N5878 --> N5879
  N5880[stop()]:::mth
  N5878 --> N5880
  N5881[recordMetric()]:::mth
  N5878 --> N5881
  N5882[incrementCounter()]:::mth
  N5878 --> N5882
  N5883[recordHistogram()]:::mth
  N5878 --> N5883
  N5886[File: MonitoringSystem.ts]:::file
  N5066 --> N5886
  N5887[Class: MonitoringSystem]:::cls
  N5886 --> N5887
  N5888[initialize()]:::mth
  N5887 --> N5888
  N5889[shutdown()]:::mth
  N5887 --> N5889
  N5890[getMetricsCollector()]:::mth
  N5887 --> N5890
  N5891[getAlertManager()]:::mth
  N5887 --> N5891
  N5892[getDashboardManager()]:::mth
  N5887 --> N5892
  N5893[File: PerformanceMonitor.ts]:::file
  N5066 --> N5893
  N5894[Class: PerformanceMonitor]:::cls
  N5893 --> N5894
  N5895[start()]:::mth
  N5894 --> N5895
  N5896[stop()]:::mth
  N5894 --> N5896
  N5897[recordRequestStart()]:::mth
  N5894 --> N5897
  N5898[recordRequestEnd()]:::mth
  N5894 --> N5898
  N5899[recordConnection()]:::mth
  N5894 --> N5899
  N5900[File: SystemHealthMonitor.ts]:::file
  N5066 --> N5900
  N5901[Class: SystemHealthMonitor]:::cls
  N5900 --> N5901
  N5902[start()]:::mth
  N5901 --> N5902
  N5903[stop()]:::mth
  N5901 --> N5903
  N5904[getHealthStatus()]:::mth
  N5901 --> N5904
  N5905[getHealthChecks()]:::mth
  N5901 --> N5905
  N5906[registerHealthCheck()]:::mth
  N5901 --> N5906
  N5909[File: CacheStrategy.ts]:::file
  N5066 --> N5909
  N5910[Class: LRUCache]:::cls
  N5909 --> N5910
  N5911[get()]:::mth
  N5910 --> N5911
  N5912[get()]:::mth
  N5910 --> N5912
  N5913[set()]:::mth
  N5910 --> N5913
  N5914[has()]:::mth
  N5910 --> N5914
  N5915[delete()]:::mth
  N5910 --> N5915
  N5916[Class: MultiLevelCache]:::cls
  N5909 --> N5916
  N5917[get()]:::mth
  N5916 --> N5917
  N5918[get()]:::mth
  N5916 --> N5918
  N5919[set()]:::mth
  N5916 --> N5919
  N5920[has()]:::mth
  N5916 --> N5920
  N5921[delete()]:::mth
  N5916 --> N5921
  N5922[Class: CacheFactory]:::cls
  N5909 --> N5922
  N5923[get()]:::mth
  N5922 --> N5923
  N5924[get()]:::mth
  N5922 --> N5924
  N5925[set()]:::mth
  N5922 --> N5925
  N5926[has()]:::mth
  N5922 --> N5926
  N5927[delete()]:::mth
  N5922 --> N5927
  N5928[File: ConnectionPoolOptimizer.ts]:::file
  N5066 --> N5928
  N5929[Class: OptimizedConnectionPool]:::cls
  N5928 --> N5929
  N5930[connect()]:::mth
  N5929 --> N5930
  N5931[createConnection()]:::mth
  N5929 --> N5931
  N5932[initialize()]:::mth
  N5929 --> N5932
  N5933[shutdown()]:::mth
  N5929 --> N5933
  N5934[acquire()]:::mth
  N5929 --> N5934
  N5935[Class: ConnectionPoolFactory]:::cls
  N5928 --> N5935
  N5936[connect()]:::mth
  N5935 --> N5936
  N5937[createConnection()]:::mth
  N5935 --> N5937
  N5938[initialize()]:::mth
  N5935 --> N5938
  N5939[shutdown()]:::mth
  N5935 --> N5939
  N5940[acquire()]:::mth
  N5935 --> N5940
  N5941[File: LoadTestRunner.ts]:::file
  N5066 --> N5941
  N5942[Class: VirtualUser]:::cls
  N5941 --> N5942
  N5943[start()]:::mth
  N5942 --> N5943
  N5944[stop()]:::mth
  N5942 --> N5944
  N5945[executeOperation()]:::mth
  N5942 --> N5945
  N5946[selectOperation()]:::mth
  N5942 --> N5946
  N5947[performRequest()]:::mth
  N5942 --> N5947
  N5948[Class: LoadTestRunner]:::cls
  N5941 --> N5948
  N5949[start()]:::mth
  N5948 --> N5949
  N5950[stop()]:::mth
  N5948 --> N5950
  N5951[executeOperation()]:::mth
  N5948 --> N5951
  N5952[selectOperation()]:::mth
  N5948 --> N5952
  N5953[performRequest()]:::mth
  N5948 --> N5953
  N5955[File: PerformanceValidator.ts]:::file
  N5066 --> N5955
  N5956[Class: PerformanceValidator]:::cls
  N5955 --> N5956
  N5957[validatePerformance()]:::mth
  N5956 --> N5957
  N5958[runScalabilityTest()]:::mth
  N5956 --> N5958
  N5959[runStressTest()]:::mth
  N5956 --> N5959
  N5960[extractMetrics()]:::mth
  N5956 --> N5960
  N5961[validateTargets()]:::mth
  N5956 --> N5961
  N5965[File: MCPServer.ts]:::file
  N5066 --> N5965
  N5966[Class: implements]:::cls
  N5965 --> N5966
  N5967[start()]:::mth
  N5966 --> N5967
  N5968[stop()]:::mth
  N5966 --> N5968
  N5969[registerResource()]:::mth
  N5966 --> N5969
  N5970[registerTool()]:::mth
  N5966 --> N5970
  N5971[registerCapability()]:::mth
  N5966 --> N5971
  N5972[Class: MCPServer]:::cls
  N5965 --> N5972
  N5973[start()]:::mth
  N5972 --> N5973
  N5974[stop()]:::mth
  N5972 --> N5974
  N5975[registerResource()]:::mth
  N5972 --> N5975
  N5976[registerTool()]:::mth
  N5972 --> N5976
  N5977[registerCapability()]:::mth
  N5972 --> N5977
  N5979[File: load-test.ts]:::file
  N5066 --> N5979
  N5980[Class: LoadTestRunner]:::cls
  N5979 --> N5980
  N5981[runLoadTest()]:::mth
  N5980 --> N5981
  N5982[executeLoadTest()]:::mth
  N5980 --> N5982
  N5983[runWarmup()]:::mth
  N5980 --> N5983
  N5984[executeMainLoadTest()]:::mth
  N5980 --> N5984
  N5985[createClients()]:::mth
  N5980 --> N5985
  N5986[Class: LoadTestClient]:::cls
  N5979 --> N5986
  N5987[runLoadTest()]:::mth
  N5986 --> N5987
  N5988[executeLoadTest()]:::mth
  N5986 --> N5988
  N5989[runWarmup()]:::mth
  N5986 --> N5989
  N5990[executeMainLoadTest()]:::mth
  N5986 --> N5990
  N5991[createClients()]:::mth
  N5986 --> N5991
  N5992[Class: LoadTestScenarios]:::cls
  N5979 --> N5992
  N5993[runLoadTest()]:::mth
  N5992 --> N5993
  N5994[executeLoadTest()]:::mth
  N5992 --> N5994
  N5995[runWarmup()]:::mth
  N5992 --> N5995
  N5996[executeMainLoadTest()]:::mth
  N5992 --> N5996
  N5997[createClients()]:::mth
  N5992 --> N5997
  N5998[Class: LoadTestReporter]:::cls
  N5979 --> N5998
  N5999[runLoadTest()]:::mth
  N5998 --> N5999
  N6000[executeLoadTest()]:::mth
  N5998 --> N6000
  N6001[runWarmup()]:::mth
  N5998 --> N6001
  N6002[executeMainLoadTest()]:::mth
  N5998 --> N6002
  N6003[createClients()]:::mth
  N5998 --> N6003
  N6004[File: VideoGenerationTool.ts]:::file
  N5066 --> N6004
  N6005[Class: VideoGenerationHandler]:::cls
  N6004 --> N6005
  N6006[initializeProviders()]:::mth
  N6005 --> N6006
  N6007[validate()]:::mth
  N6005 --> N6007
  N6008[execute()]:::mth
  N6005 --> N6008
  N6009[getUsageStats()]:::mth
  N6005 --> N6009
  N6010[cleanup()]:::mth
  N6005 --> N6010
  N6011[File: index.ts]:::file
  N5066 --> N6011
  N6012[Class: export]:::cls
  N6011 --> N6012
  N6013[createVideoToolFromEnv()]:::mth
  N6012 --> N6013
  N6014[File: IVideoProvider.ts]:::file
  N5066 --> N6014
  N6015[Class: for]:::cls
  N6014 --> N6015
  N6016[isAvailable()]:::mth
  N6015 --> N6016
  N6017[downloadVideo()]:::mth
  N6015 --> N6017
  N6018[getDefaultBaseUrl()]:::mth
  N6015 --> N6018
  N6019[downloadVideo()]:::mth
  N6015 --> N6019
  N6020[setAuthHeader()]:::mth
  N6015 --> N6020
  N6021[Class: BaseVideoProvider]:::cls
  N6014 --> N6021
  N6022[isAvailable()]:::mth
  N6021 --> N6022
  N6023[downloadVideo()]:::mth
  N6021 --> N6023
  N6024[getDefaultBaseUrl()]:::mth
  N6021 --> N6024
  N6025[downloadVideo()]:::mth
  N6021 --> N6025
  N6026[setAuthHeader()]:::mth
  N6021 --> N6026
  N6027[File: ReplicateProvider.ts]:::file
  N5066 --> N6027
  N6028[Class: ReplicateProvider]:::cls
  N6027 --> N6028
  N6029[getDefaultBaseUrl()]:::mth
  N6028 --> N6029
  N6030[getCapabilities()]:::mth
  N6028 --> N6030
  N6031[validateCredentials()]:::mth
  N6028 --> N6031
  N6032[estimateCost()]:::mth
  N6028 --> N6032
  N6033[generateVideo()]:::mth
  N6028 --> N6033
  N6041[File: error.ts]:::file
  N5066 --> N6041
  N6042[Class: MCPErrorClass]:::cls
  N6041 --> N6042
  N6043[toJSONRPC()]:::mth
  N6042 --> N6043
  N6044[inferCategory()]:::mth
  N6042 --> N6044
  N6045[inferSeverity()]:::mth
  N6042 --> N6045
  N6046[inferRetryable()]:::mth
  N6042 --> N6046
  N6053[File: skill.ts]:::file
  N5066 --> N6053
  N6054[Class: of]:::cls
  N6053 --> N6054
  N6057[File: Logger.ts]:::file
  N5066 --> N6057
  N6058[Class: Logger]:::cls
  N6057 --> N6058
  N6059[debug()]:::mth
  N6058 --> N6059
  N6060[info()]:::mth
  N6058 --> N6060
  N6061[warn()]:::mth
  N6058 --> N6061
  N6062[error()]:::mth
  N6058 --> N6062
  N6063[shouldLog()]:::mth
  N6058 --> N6063
  N6067[File: messageValidator.ts]:::file
  N5066 --> N6067
  N6068[Class: for]:::cls
  N6067 --> N6068
  N6069[validateMessage()]:::mth
  N6068 --> N6069
  N6070[validateRequest()]:::mth
  N6068 --> N6070
  N6071[validateResponse()]:::mth
  N6068 --> N6071
  N6072[validateNotification()]:::mth
  N6068 --> N6072
  N6073[validateRequestParams()]:::mth
  N6068 --> N6073
  N6074[Class: MessageValidator]:::cls
  N6067 --> N6074
  N6075[validateMessage()]:::mth
  N6074 --> N6075
  N6076[validateRequest()]:::mth
  N6074 --> N6076
  N6077[validateResponse()]:::mth
  N6074 --> N6077
  N6078[validateNotification()]:::mth
  N6074 --> N6078
  N6079[validateRequestParams()]:::mth
  N6074 --> N6079
  N6082[File: serialization.ts]:::file
  N5066 --> N6082
  N6083[Class: for]:::cls
  N6082 --> N6083
  N6084[serialize()]:::mth
  N6083 --> N6084
  N6085[deserialize()]:::mth
  N6083 --> N6085
  N6086[serializeBatch()]:::mth
  N6083 --> N6086
  N6087[deserializeBatch()]:::mth
  N6083 --> N6087
  N6088[prepareForSerialization()]:::mth
  N6083 --> N6088
  N6089[Class: MessageSerializer]:::cls
  N6082 --> N6089
  N6090[serialize()]:::mth
  N6089 --> N6090
  N6091[deserialize()]:::mth
  N6089 --> N6091
  N6092[serializeBatch()]:::mth
  N6089 --> N6092
  N6093[deserializeBatch()]:::mth
  N6089 --> N6093
  N6094[prepareForSerialization()]:::mth
  N6089 --> N6094
  N6095[Class: SerializationUtils]:::cls
  N6082 --> N6095
  N6096[serialize()]:::mth
  N6095 --> N6096
  N6097[deserialize()]:::mth
  N6095 --> N6097
  N6098[serializeBatch()]:::mth
  N6095 --> N6098
  N6099[deserializeBatch()]:::mth
  N6095 --> N6099
  N6100[prepareForSerialization()]:::mth
  N6095 --> N6100
  N6102[File: validator.ts]:::file
  N5066 --> N6102
  N6103[Class: MCPValidator]:::cls
  N6102 --> N6103
  N6104[compileSchemas()]:::mth
  N6103 --> N6104
  N6105[validateJSONRPCRequest()]:::mth
  N6103 --> N6105
  N6106[validateJSONRPCResponse()]:::mth
  N6103 --> N6106
  N6107[validateJSONRPCNotification()]:::mth
  N6103 --> N6107
  N6108[validateMCPRequest()]:::mth
  N6103 --> N6108
  N6111[mcp-skills-server]:::pkg
  TNF --> N6111
  N6112[File: SkillsMCPServer.ts]:::file
  N6111 --> N6112
  N6113[Class: SkillsMCPServer]:::cls
  N6112 --> N6113
  N6114[initialize()]:::mth
  N6113 --> N6114
  N6115[scanSkills()]:::mth
  N6113 --> N6115
  N6116[parseSkillFile()]:::mth
  N6113 --> N6116
  N6117[setupHandlers()]:::mth
  N6113 --> N6117
  N6118[start()]:::mth
  N6113 --> N6118
  N6120[monitoring]:::pkg
  TNF --> N6120
  N6121[File: index.ts]:::file
  N6120 --> N6121
  N6122[Class: MonitoringService]:::cls
  N6121 --> N6122
  N6123[healthCheck()]:::mth
  N6122 --> N6123
  N6124[getMetrics()]:::mth
  N6122 --> N6124
  N6125[getAlerts()]:::mth
  N6122 --> N6125
  N6126[getPerformanceStats()]:::mth
  N6122 --> N6126
  N6127[getErrorStats()]:::mth
  N6122 --> N6127
  N6128[Class: MetricsCollector]:::cls
  N6121 --> N6128
  N6129[healthCheck()]:::mth
  N6128 --> N6129
  N6130[getMetrics()]:::mth
  N6128 --> N6130
  N6131[getAlerts()]:::mth
  N6128 --> N6131
  N6132[getPerformanceStats()]:::mth
  N6128 --> N6132
  N6133[getErrorStats()]:::mth
  N6128 --> N6133
  N6134[Class: AlertService]:::cls
  N6121 --> N6134
  N6135[healthCheck()]:::mth
  N6134 --> N6135
  N6136[getMetrics()]:::mth
  N6134 --> N6136
  N6137[getAlerts()]:::mth
  N6134 --> N6137
  N6138[getPerformanceStats()]:::mth
  N6134 --> N6138
  N6139[getErrorStats()]:::mth
  N6134 --> N6139
  N6140[Class: PerformanceMonitoringService]:::cls
  N6121 --> N6140
  N6141[healthCheck()]:::mth
  N6140 --> N6141
  N6142[getMetrics()]:::mth
  N6140 --> N6142
  N6143[getAlerts()]:::mth
  N6140 --> N6143
  N6144[getPerformanceStats()]:::mth
  N6140 --> N6144
  N6145[getErrorStats()]:::mth
  N6140 --> N6145
  N6146[Class: ErrorTrackingService]:::cls
  N6121 --> N6146
  N6147[healthCheck()]:::mth
  N6146 --> N6147
  N6148[getMetrics()]:::mth
  N6146 --> N6148
  N6149[getAlerts()]:::mth
  N6146 --> N6149
  N6150[getPerformanceStats()]:::mth
  N6146 --> N6150
  N6151[getErrorStats()]:::mth
  N6146 --> N6151
  N6152[Class: SystemHealthService]:::cls
  N6121 --> N6152
  N6153[healthCheck()]:::mth
  N6152 --> N6153
  N6154[getMetrics()]:::mth
  N6152 --> N6154
  N6155[getAlerts()]:::mth
  N6152 --> N6155
  N6156[getPerformanceStats()]:::mth
  N6152 --> N6156
  N6157[getErrorStats()]:::mth
  N6152 --> N6157
  N6158[Class: SecurityLoggingService]:::cls
  N6121 --> N6158
  N6159[healthCheck()]:::mth
  N6158 --> N6159
  N6160[getMetrics()]:::mth
  N6158 --> N6160
  N6161[getAlerts()]:::mth
  N6158 --> N6161
  N6162[getPerformanceStats()]:::mth
  N6158 --> N6162
  N6163[getErrorStats()]:::mth
  N6158 --> N6163
  N6164[n8n-workflows]:::pkg
  TNF --> N6164
  N6165[File: WorkflowCategorizer.ts]:::file
  N6164 --> N6165
  N6166[Class: WorkflowCategorizer]:::cls
  N6165 --> N6166
  N6167[categorize()]:::mth
  N6166 --> N6167
  N6168[categorizeWorkflows()]:::mth
  N6166 --> N6168
  N6169[getCategoryStats()]:::mth
  N6166 --> N6169
  N6170[getCategoryConfigs()]:::mth
  N6166 --> N6170
  N6171[getCategoryConfig()]:::mth
  N6166 --> N6171
  N6172[File: WorkflowFetcher.ts]:::file
  N6164 --> N6172
  N6173[Class: WorkflowFetcher]:::cls
  N6172 --> N6173
  N6174[fetchAll()]:::mth
  N6173 --> N6174
  N6175[fetchFromRepository()]:::mth
  N6173 --> N6175
  N6176[loadWorkflowsFromRepo()]:::mth
  N6173 --> N6176
  N6177[isWorkflowFile()]:::mth
  N6173 --> N6177
  N6178[getRepoPath()]:::mth
  N6173 --> N6178
  N6180[File: WorkflowParser.ts]:::file
  N6164 --> N6180
  N6181[Class: WorkflowParser]:::cls
  N6180 --> N6181
  N6182[parseWorkflow()]:::mth
  N6181 --> N6182
  N6183[isValidWorkflow()]:::mth
  N6181 --> N6183
  N6184[extractNodes()]:::mth
  N6181 --> N6184
  N6185[extractTriggers()]:::mth
  N6181 --> N6185
  N6186[determineTriggerType()]:::mth
  N6181 --> N6186
  N6187[File: WorkflowRegistry.ts]:::file
  N6164 --> N6187
  N6188[Class: WorkflowRegistry]:::cls
  N6187 --> N6188
  N6189[initialize()]:::mth
  N6188 --> N6189
  N6190[addWorkflow()]:::mth
  N6188 --> N6190
  N6191[addWorkflows()]:::mth
  N6188 --> N6191
  N6192[getWorkflow()]:::mth
  N6188 --> N6192
  N6193[getAllWorkflows()]:::mth
  N6188 --> N6193
  N6197[File: WorkflowService.ts]:::file
  N6164 --> N6197
  N6198[Class: WorkflowService]:::cls
  N6197 --> N6198
  N6199[initialize()]:::mth
  N6198 --> N6199
  N6200[syncWorkflows()]:::mth
  N6198 --> N6200
  N6201[syncFromSource()]:::mth
  N6198 --> N6201
  N6202[search()]:::mth
  N6198 --> N6202
  N6203[getWorkflow()]:::mth
  N6198 --> N6203
  N6206[port-management]:::pkg
  TNF --> N6206
  N6207[File: config-updater.ts]:::file
  N6206 --> N6207
  N6208[Class: ConfigurationUpdater]:::cls
  N6207 --> N6208
  N6209[updateServiceConfiguration()]:::mth
  N6208 --> N6209
  N6211[File: port-registry.service.ts]:::file
  N6206 --> N6211
  N6212[Class: PortRegistryService]:::cls
  N6211 --> N6212
  N6213[registerPort()]:::mth
  N6212 --> N6213
  N6214[findAvailablePort()]:::mth
  N6212 --> N6214
  N6215[isPortAvailable()]:::mth
  N6212 --> N6215
  N6216[detectConflicts()]:::mth
  N6212 --> N6216
  N6217[reassignPort()]:::mth
  N6212 --> N6217
  N6218[prompt-templating]:::pkg
  TNF --> N6218
  N6219[File: PromptTemplateService.ts]:::file
  N6218 --> N6219
  N6220[Class: PromptTemplateServiceImpl]:::cls
  N6219 --> N6220
  N6221[createTemplate()]:::mth
  N6220 --> N6221
  N6222[getTemplate()]:::mth
  N6220 --> N6222
  N6223[updateTemplate()]:::mth
  N6220 --> N6223
  N6224[deleteTemplate()]:::mth
  N6220 --> N6224
  N6225[listTemplates()]:::mth
  N6220 --> N6225
  N6228[proto-definitions]:::pkg
  TNF --> N6228
  N6231[relay-core]:::pkg
  TNF --> N6231
  N6232[File: TerminalFederationBridge.ts]:::file
  N6231 --> N6232
  N6233[Class: TerminalFederationBridge]:::cls
  N6232 --> N6233
  N6234[initialize()]:::mth
  N6233 --> N6234
  N6235[recordHeartbeat()]:::mth
  N6233 --> N6235
  N6236[cleanup()]:::mth
  N6233 --> N6236
  N6237[File: UnifiedBridge.ts]:::file
  N6231 --> N6237
  N6238[Class: UnifiedBridge]:::cls
  N6237 --> N6238
  N6239[addTransport()]:::mth
  N6238 --> N6239
  N6240[handleMessage()]:::mth
  N6238 --> N6240
  N6241[broadcast()]:::mth
  N6238 --> N6241
  N6242[send()]:::mth
  N6238 --> N6242
  N6243[File: agent-registry-bridge.ts]:::file
  N6231 --> N6243
  N6244[Class: AgentRegistryBridge]:::cls
  N6243 --> N6244
  N6245[connect()]:::mth
  N6244 --> N6245
  N6246[register()]:::mth
  N6244 --> N6246
  N6247[handleMessage()]:::mth
  N6244 --> N6247
  N6248[send()]:::mth
  N6244 --> N6248
  N6249[startHeartbeat()]:::mth
  N6244 --> N6249
  N6250[File: JWTAuthService.ts]:::file
  N6231 --> N6250
  N6251[Class: JWTAuthService]:::cls
  N6250 --> N6251
  N6252[generateToken()]:::mth
  N6251 --> N6252
  N6253[verifyToken()]:::mth
  N6251 --> N6253
  N6254[decodeToken()]:::mth
  N6251 --> N6254
  N6255[hasCapability()]:::mth
  N6251 --> N6255
  N6256[hasAllCapabilities()]:::mth
  N6251 --> N6256
  N6257[File: broker-agent.ts]:::file
  N6231 --> N6257
  N6258[Class: BrokerAgent]:::cls
  N6257 --> N6258
  N6259[start()]:::mth
  N6258 --> N6259
  N6260[registerBroker()]:::mth
  N6258 --> N6260
  N6261[startHeartbeat()]:::mth
  N6258 --> N6261
  N6262[consumeLoop()]:::mth
  N6258 --> N6262
  N6263[safeParseTask()]:::mth
  N6258 --> N6263
  N6267[File: director-agent.ts]:::file
  N6231 --> N6267
  N6268[Class: DirectorAgent]:::cls
  N6267 --> N6268
  N6269[start()]:::mth
  N6268 --> N6269
  N6270[registerDirector()]:::mth
  N6268 --> N6270
  N6271[startHeartbeat()]:::mth
  N6268 --> N6271
  N6272[consumeLoop()]:::mth
  N6268 --> N6272
  N6273[safeParseReview()]:::mth
  N6268 --> N6273
  N6277[File: master-clock.ts]:::file
  N6231 --> N6277
  N6278[Class: AgentRegistry]:::cls
  N6277 --> N6278
  N6279[DIRECTOR()]:::mth
  N6278 --> N6279
  N6280[log()]:::mth
  N6278 --> N6280
  N6281[logToFile()]:::mth
  N6278 --> N6281
  N6282[createMasterClockAgentIdentity()]:::mth
  N6278 --> N6282
  N6283[createOrchestratorIdentity()]:::mth
  N6278 --> N6283
  N6284[Class: MasterClock]:::cls
  N6277 --> N6284
  N6285[DIRECTOR()]:::mth
  N6284 --> N6285
  N6286[log()]:::mth
  N6284 --> N6286
  N6287[logToFile()]:::mth
  N6284 --> N6287
  N6288[createMasterClockAgentIdentity()]:::mth
  N6284 --> N6288
  N6289[createOrchestratorIdentity()]:::mth
  N6284 --> N6289
  N6290[File: conversation-state-machine.ts]:::file
  N6231 --> N6290
  N6291[Class: ConversationStateMachine]:::cls
  N6290 --> N6291
  N6292[currentPhase()]:::mth
  N6291 --> N6292
  N6293[getPhase()]:::mth
  N6291 --> N6293
  N6294[durationInPhase()]:::mth
  N6291 --> N6294
  N6295[recordActivity()]:::mth
  N6291 --> N6295
  N6296[pause()]:::mth
  N6291 --> N6296
  N6297[File: subscription-registry.ts]:::file
  N6231 --> N6297
  N6298[Class: SubscriptionRegistry]:::cls
  N6297 --> N6298
  N6299[register()]:::mth
  N6298 --> N6299
  N6300[unregister()]:::mth
  N6298 --> N6300
  N6301[getSubscribers()]:::mth
  N6298 --> N6301
  N6302[getAgentSubscriptions()]:::mth
  N6298 --> N6302
  N6303[clearAgent()]:::mth
  N6298 --> N6303
  N6307[File: tnf-envelope.ts]:::file
  N6231 --> N6307
  N6308[Class: TNFMessageBuilder]:::cls
  N6307 --> N6308
  N6309[normalizeAgentIdentity()]:::mth
  N6308 --> N6309
  N6310[normalizeRecipient()]:::mth
  N6308 --> N6310
  N6311[resolveEnvelopeAuditTrace()]:::mth
  N6308 --> N6311
  N6312[getTNFEnvelopeAuditTrace()]:::mth
  N6308 --> N6312
  N6313[normalizeTNFEnvelope()]:::mth
  N6308 --> N6313
  N6314[File: A2AProtocolAdapter.ts]:::file
  N6231 --> N6314
  N6315[Class: A2AProtocolAdapter]:::cls
  N6314 --> N6315
  N6316[canTranslate()]:::mth
  N6315 --> N6316
  N6317[translate()]:::mth
  N6315 --> N6317
  N6318[File: AnthropicXmlAdapter.ts]:::file
  N6231 --> N6318
  N6319[Class: AnthropicXmlAdapter]:::cls
  N6318 --> N6319
  N6320[canTranslate()]:::mth
  N6319 --> N6320
  N6321[translate()]:::mth
  N6319 --> N6321
  N6322[anthropicXmlToA2A()]:::mth
  N6319 --> N6322
  N6323[a2aToAnthropicXml()]:::mth
  N6319 --> N6323
  N6324[isAnthropicXmlFunctionCall()]:::mth
  N6319 --> N6324
  N6325[File: CrewAIAdapter.ts]:::file
  N6231 --> N6325
  N6326[Class: CrewAIAdapter]:::cls
  N6325 --> N6326
  N6327[canTranslate()]:::mth
  N6326 --> N6327
  N6328[translate()]:::mth
  N6326 --> N6328
  N6329[crewaiToA2A()]:::mth
  N6326 --> N6329
  N6330[a2aToCrewAI()]:::mth
  N6326 --> N6330
  N6331[isCrewAITaskExecution()]:::mth
  N6326 --> N6331
  N6332[File: GooseAdapter.ts]:::file
  N6231 --> N6332
  N6333[Class: GooseAdapter]:::cls
  N6332 --> N6333
  N6334[canTranslate()]:::mth
  N6333 --> N6334
  N6335[translate()]:::mth
  N6333 --> N6335
  N6336[gooseToA2A()]:::mth
  N6333 --> N6336
  N6337[a2aToGoose()]:::mth
  N6333 --> N6337
  N6338[withMetadata()]:::mth
  N6333 --> N6338
  N6339[File: LangchainAdapter.ts]:::file
  N6231 --> N6339
  N6340[Class: LangchainAdapter]:::cls
  N6339 --> N6340
  N6341[canTranslate()]:::mth
  N6340 --> N6341
  N6342[translate()]:::mth
  N6340 --> N6342
  N6343[langchainToA2A()]:::mth
  N6340 --> N6343
  N6344[a2aToLangchain()]:::mth
  N6340 --> N6344
  N6345[isLangchainAgentAction()]:::mth
  N6340 --> N6345
  N6346[File: OpenAIAdapter.ts]:::file
  N6231 --> N6346
  N6347[Class: OpenAIAdapter]:::cls
  N6346 --> N6347
  N6348[canTranslate()]:::mth
  N6347 --> N6348
  N6349[translate()]:::mth
  N6347 --> N6349
  N6350[openaiToA2A()]:::mth
  N6347 --> N6350
  N6351[a2aToOpenAI()]:::mth
  N6347 --> N6351
  N6352[isOpenAIFunctionCall()]:::mth
  N6347 --> N6352
  N6354[File: ProtocolTranslator.ts]:::file
  N6231 --> N6354
  N6355[Class: ProtocolTranslator]:::cls
  N6354 --> N6355
  N6356[registerAdapter()]:::mth
  N6355 --> N6356
  N6357[translate()]:::mth
  N6355 --> N6357
  N6358[findAdapter()]:::mth
  N6355 --> N6358
  N6359[File: redis-relay-bridge.ts]:::file
  N6231 --> N6359
  N6360[Class: RedisRelayBridge]:::cls
  N6359 --> N6360
  N6361[setupErrorHandlers()]:::mth
  N6360 --> N6361
  N6362[connect()]:::mth
  N6360 --> N6362
  N6363[disconnect()]:::mth
  N6360 --> N6363
  N6364[handleRelayMessage()]:::mth
  N6360 --> N6364
  N6365[unsubscribeFromAgent()]:::mth
  N6360 --> N6365
  N6366[File: RelayServer.ts]:::file
  N6231 --> N6366
  N6367[Class: RelayServer]:::cls
  N6366 --> N6367
  N6368[setupEventHandlers()]:::mth
  N6367 --> N6368
  N6369[start()]:::mth
  N6367 --> N6369
  N6370[stop()]:::mth
  N6367 --> N6370
  N6371[initializeTransports()]:::mth
  N6367 --> N6371
  N6372[startTransports()]:::mth
  N6367 --> N6372
  N6373[File: CleanupService.ts]:::file
  N6231 --> N6373
  N6374[Class: CleanupService]:::cls
  N6373 --> N6374
  N6375[addCleanupTarget()]:::mth
  N6374 --> N6375
  N6376[addRelayConsolidationTargets()]:::mth
  N6374 --> N6376
  N6377[executeCleanup()]:::mth
  N6374 --> N6377
  N6378[createBackup()]:::mth
  N6374 --> N6378
  N6379[removeTarget()]:::mth
  N6374 --> N6379
  N6380[File: GooseCliBridgeService.ts]:::file
  N6231 --> N6380
  N6381[Class: GooseCliBridgeService]:::cls
  N6380 --> N6381
  N6382[run()]:::mth
  N6381 --> N6382
  N6383[File: HandoffStoreService.ts]:::file
  N6231 --> N6383
  N6384[Class: HandoffStoreService]:::cls
  N6383 --> N6384
  N6385[connect()]:::mth
  N6384 --> N6385
  N6386[close()]:::mth
  N6384 --> N6386
  N6387[publish()]:::mth
  N6384 --> N6387
  N6388[getPacket()]:::mth
  N6384 --> N6388
  N6389[listForAgent()]:::mth
  N6384 --> N6389
  N6390[File: HeartbeatMonitoringService.ts]:::file
  N6231 --> N6390
  N6391[Class: HeartbeatMonitoringService]:::cls
  N6390 --> N6391
  N6392[start()]:::mth
  N6391 --> N6392
  N6393[stop()]:::mth
  N6391 --> N6393
  N6394[registerAgent()]:::mth
  N6391 --> N6394
  N6395[unregisterAgent()]:::mth
  N6391 --> N6395
  N6396[recordHeartbeat()]:::mth
  N6391 --> N6396
  N6397[File: LeverageMonitorService.ts]:::file
  N6231 --> N6397
  N6398[Class: LeverageMonitorService]:::cls
  N6397 --> N6398
  N6399[recordLeverageEvent()]:::mth
  N6398 --> N6399
  N6400[getAbundanceReport()]:::mth
  N6398 --> N6400
  N6401[File: MasterAgentRegistry.ts]:::file
  N6231 --> N6401
  N6402[Class: AgentRegistry]:::cls
  N6401 --> N6402
  N6403[registerAgent()]:::mth
  N6402 --> N6403
  N6404[getAgent()]:::mth
  N6402 --> N6404
  N6405[getAllAgents()]:::mth
  N6402 --> N6405
  N6406[updateMetadata()]:::mth
  N6402 --> N6406
  N6407[getMetadata()]:::mth
  N6402 --> N6407
  N6408[Class: AgentMetadataManager]:::cls
  N6401 --> N6408
  N6409[registerAgent()]:::mth
  N6408 --> N6409
  N6410[getAgent()]:::mth
  N6408 --> N6410
  N6411[getAllAgents()]:::mth
  N6408 --> N6411
  N6412[updateMetadata()]:::mth
  N6408 --> N6412
  N6413[getMetadata()]:::mth
  N6408 --> N6413
  N6414[Class: MasterAgentRegistry]:::cls
  N6401 --> N6414
  N6415[registerAgent()]:::mth
  N6414 --> N6415
  N6416[getAgent()]:::mth
  N6414 --> N6416
  N6417[getAllAgents()]:::mth
  N6414 --> N6417
  N6418[updateMetadata()]:::mth
  N6414 --> N6418
  N6419[getMetadata()]:::mth
  N6414 --> N6419
  N6420[File: MiniOmniBridgeService.ts]:::file
  N6231 --> N6420
  N6421[Class: MiniOmniBridgeService]:::cls
  N6420 --> N6421
  N6422[run()]:::mth
  N6421 --> N6422
  N6423[File: OrchestratorIntegrationService.ts]:::file
  N6231 --> N6423
  N6424[Class: OrchestratorIntegrationService]:::cls
  N6423 --> N6424
  N6425[initialize()]:::mth
  N6424 --> N6425
  N6426[shutdown()]:::mth
  N6424 --> N6426
  N6427[pruneTaskStates()]:::mth
  N6424 --> N6427
  N6428[setupEventHandlers()]:::mth
  N6424 --> N6428
  N6429[initializeStatePreservation()]:::mth
  N6424 --> N6429
  N6430[File: VCIssuanceService.ts]:::file
  N6231 --> N6430
  N6431[Class: VCIssuanceService]:::cls
  N6430 --> N6431
  N6432[issueCredential()]:::mth
  N6431 --> N6432
  N6433[verifyCredential()]:::mth
  N6431 --> N6433
  N6434[revokeCredential()]:::mth
  N6431 --> N6434
  N6435[gatherCapabilityEvidence()]:::mth
  N6431 --> N6435
  N6436[assessCapabilityPerformance()]:::mth
  N6431 --> N6436
  N6437[File: BlockchainService.ts]:::file
  N6231 --> N6437
  N6438[Class: BlockchainService]:::cls
  N6437 --> N6438
  N6439[initializeConnection()]:::mth
  N6438 --> N6439
  N6440[isBlockchainConnected()]:::mth
  N6438 --> N6440
  N6441[getProvider()]:::mth
  N6438 --> N6441
  N6442[getWallet()]:::mth
  N6438 --> N6442
  N6443[getConfig()]:::mth
  N6438 --> N6443
  N6444[File: StubServices.ts]:::file
  N6231 --> N6444
  N6445[Class: AgentHandoffTemplateService]:::cls
  N6444 --> N6445
  N6446[generateHandoffTemplate()]:::mth
  N6445 --> N6446
  N6447[createHandoffPrompt()]:::mth
  N6445 --> N6447
  N6448[listen()]:::mth
  N6445 --> N6448
  N6449[Class: BlockchainEventMonitor]:::cls
  N6444 --> N6449
  N6450[generateHandoffTemplate()]:::mth
  N6449 --> N6450
  N6451[createHandoffPrompt()]:::mth
  N6449 --> N6451
  N6452[listen()]:::mth
  N6449 --> N6452
  N6453[File: stall-detector.ts]:::file
  N6231 --> N6453
  N6454[Class: StallDetector]:::cls
  N6453 --> N6454
  N6455[start()]:::mth
  N6454 --> N6455
  N6456[stop()]:::mth
  N6454 --> N6456
  N6457[trackConversation()]:::mth
  N6454 --> N6457
  N6458[recordActivity()]:::mth
  N6454 --> N6458
  N6459[completeConversation()]:::mth
  N6454 --> N6459
  N6460[File: standalone-relay.ts]:::file
  N6231 --> N6460
  N6461[Class: TNFRelayServer]:::cls
  N6460 --> N6461
  N6462[buildRelayAgentIdentity()]:::mth
  N6461 --> N6462
  N6463[resolveRelayAgentStatus()]:::mth
  N6461 --> N6463
  N6464[buildBridgeOperatorContext()]:::mth
  N6461 --> N6464
  N6465[Redis()]:::mth
  N6461 --> N6465
  N6466[handleHttpRequest()]:::mth
  N6461 --> N6466
  N6467[File: super-cycle-client.ts]:::file
  N6231 --> N6467
  N6468[Class: participants]:::cls
  N6467 --> N6468
  N6469[parseArgs()]:::mth
  N6468 --> N6469
  N6470[mapActionToType()]:::mth
  N6468 --> N6470
  N6471[main()]:::mth
  N6468 --> N6471
  N6472[parsePositiveNumber()]:::mth
  N6468 --> N6472
  N6473[parseTimestampMs()]:::mth
  N6468 --> N6473
  N6474[File: FileTransport.ts]:::file
  N6231 --> N6474
  N6475[Class: FileTransport]:::cls
  N6474 --> N6475
  N6476[start()]:::mth
  N6475 --> N6476
  N6477[stop()]:::mth
  N6475 --> N6477
  N6478[send()]:::mth
  N6475 --> N6478
  N6479[isConnected()]:::mth
  N6475 --> N6479
  N6480[handleFileAdd()]:::mth
  N6475 --> N6480
  N6481[File: HTTPTransport.ts]:::file
  N6231 --> N6481
  N6482[Class: HTTPTransport]:::cls
  N6481 --> N6482
  N6483[start()]:::mth
  N6482 --> N6483
  N6484[stop()]:::mth
  N6482 --> N6484
  N6485[send()]:::mth
  N6482 --> N6485
  N6486[isConnected()]:::mth
  N6482 --> N6486
  N6487[setupRoutes()]:::mth
  N6482 --> N6487
  N6488[File: MCPTransport.ts]:::file
  N6231 --> N6488
  N6489[Class: MCPTransport]:::cls
  N6488 --> N6489
  N6490[start()]:::mth
  N6489 --> N6490
  N6491[stop()]:::mth
  N6489 --> N6491
  N6492[send()]:::mth
  N6489 --> N6492
  N6493[isConnected()]:::mth
  N6489 --> N6493
  N6494[setupRequestHandlers()]:::mth
  N6489 --> N6494
  N6495[File: RedisTransport.ts]:::file
  N6231 --> N6495
  N6496[Class: RedisTransport]:::cls
  N6495 --> N6496
  N6497[setupEventHandlers()]:::mth
  N6496 --> N6497
  N6498[setupChannelSubscriptions()]:::mth
  N6496 --> N6498
  N6499[handleRedisMessage()]:::mth
  N6496 --> N6499
  N6500[start()]:::mth
  N6496 --> N6500
  N6501[stop()]:::mth
  N6496 --> N6501
  N6502[File: WebSocketTransport.ts]:::file
  N6231 --> N6502
  N6503[Class: WebSocketTransport]:::cls
  N6502 --> N6503
  N6504[start()]:::mth
  N6503 --> N6504
  N6505[stop()]:::mth
  N6503 --> N6505
  N6506[send()]:::mth
  N6503 --> N6506
  N6507[isConnected()]:::mth
  N6503 --> N6507
  N6508[handleConnection()]:::mth
  N6503 --> N6508
  N6510[File: AgentRegistry.ts]:::file
  N6231 --> N6510
  N6511[Class: AgentRegistry]:::cls
  N6510 --> N6511
  N6512[registerAgent()]:::mth
  N6511 --> N6512
  N6513[unregisterAgent()]:::mth
  N6511 --> N6513
  N6514[getAgent()]:::mth
  N6511 --> N6514
  N6515[getAllAgents()]:::mth
  N6511 --> N6515
  N6516[getAgentCount()]:::mth
  N6511 --> N6516
  N6517[File: Logger.ts]:::file
  N6231 --> N6517
  N6518[Class: Logger]:::cls
  N6517 --> N6518
  N6519[log()]:::mth
  N6518 --> N6519
  N6520[debug()]:::mth
  N6518 --> N6520
  N6521[info()]:::mth
  N6518 --> N6521
  N6522[warn()]:::mth
  N6518 --> N6522
  N6523[error()]:::mth
  N6518 --> N6523
  N6524[File: MessageRouter.ts]:::file
  N6231 --> N6524
  N6525[Class: MessageRouter]:::cls
  N6524 --> N6525
  N6526[route()]:::mth
  N6525 --> N6526
  N6528[resource-registry]:::pkg
  TNF --> N6528
  N6530[File: resource-registry.controller.ts]:::file
  N6528 --> N6530
  N6531[Class: ResourceRegistryController]:::cls
  N6530 --> N6531
  N6532[getCategories()]:::mth
  N6531 --> N6532
  N6533[extractAccessContext()]:::mth
  N6531 --> N6533
  N6534[File: create-resource.dto.ts]:::file
  N6528 --> N6534
  N6535[Class: CreateResourceDto]:::cls
  N6534 --> N6535
  N6537[File: search-resource.dto.ts]:::file
  N6528 --> N6537
  N6538[Class: SearchResourceDto]:::cls
  N6537 --> N6538
  N6539[File: update-resource.dto.ts]:::file
  N6528 --> N6539
  N6540[Class: UpdateResourceDto]:::cls
  N6539 --> N6540
  N6541[File: service-or-user-auth.guard.ts]:::file
  N6528 --> N6541
  N6542[Class: ServiceOrUserAuthGuard]:::cls
  N6541 --> N6542
  N6543[canActivate()]:::mth
  N6542 --> N6543
  N6546[File: resource-registry-mcp-server.ts]:::file
  N6528 --> N6546
  N6547[Class: ResourceRegistryMCPServer]:::cls
  N6546 --> N6547
  N6548[setupToolHandlers()]:::mth
  N6547 --> N6548
  N6549[setupErrorHandling()]:::mth
  N6547 --> N6549
  N6550[getTools()]:::mth
  N6547 --> N6550
  N6551[searchResources()]:::mth
  N6547 --> N6551
  N6552[getResource()]:::mth
  N6547 --> N6552
  N6553[File: resource-registry.module.ts]:::file
  N6528 --> N6553
  N6554[Class: ResourceRegistryModule]:::cls
  N6553 --> N6554
  N6556[File: resource-access-control.service.ts]:::file
  N6528 --> N6556
  N6557[Class: ResourceAccessControlService]:::cls
  N6556 --> N6557
  N6558[canView()]:::mth
  N6557 --> N6558
  N6559[canModify()]:::mth
  N6557 --> N6559
  N6560[canDelete()]:::mth
  N6557 --> N6560
  N6561[canExecute()]:::mth
  N6557 --> N6561
  N6562[assertCanExecute()]:::mth
  N6557 --> N6562
  N6563[File: resource-registry.service.ts]:::file
  N6528 --> N6563
  N6564[Class: ResourceRegistryService]:::cls
  N6563 --> N6564
  N6565[onModuleDestroy()]:::mth
  N6564 --> N6565
  N6566[create()]:::mth
  N6564 --> N6566
  N6567[findById()]:::mth
  N6564 --> N6567
  N6568[search()]:::mth
  N6564 --> N6568
  N6569[update()]:::mth
  N6564 --> N6569
  N6574[security]:::pkg
  TNF --> N6574
  N6575[File: EncryptionService.ts]:::file
  N6574 --> N6575
  N6576[Class: EncryptionService]:::cls
  N6575 --> N6576
  N6577[encrypt()]:::mth
  N6576 --> N6577
  N6578[decrypt()]:::mth
  N6576 --> N6578
  N6580[File: SecurityService.ts]:::file
  N6574 --> N6580
  N6581[Class: SecurityService]:::cls
  N6580 --> N6581
  N6582[encrypt()]:::mth
  N6581 --> N6582
  N6583[decrypt()]:::mth
  N6581 --> N6583
  N6584[checkRateLimit()]:::mth
  N6581 --> N6584
  N6585[authenticate()]:::mth
  N6581 --> N6585
  N6586[logAccess()]:::mth
  N6581 --> N6586
  N6587[File: index.ts]:::file
  N6574 --> N6587
  N6588[Class: AuditService]:::cls
  N6587 --> N6588
  N6589[store()]:::mth
  N6588 --> N6589
  N6590[log()]:::mth
  N6588 --> N6590
  N6591[query()]:::mth
  N6588 --> N6591
  N6592[File: storage.ts]:::file
  N6574 --> N6592
  N6593[Class: InMemoryAuditStorage]:::cls
  N6592 --> N6593
  N6594[store()]:::mth
  N6593 --> N6594
  N6595[store()]:::mth
  N6593 --> N6595
  N6596[query()]:::mth
  N6593 --> N6596
  N6597[File: hashing.service.ts]:::file
  N6574 --> N6597
  N6598[Class: HashingService]:::cls
  N6597 --> N6598
  N6599[hash()]:::mth
  N6598 --> N6599
  N6600[compare()]:::mth
  N6598 --> N6600
  N6601[File: index.ts]:::file
  N6574 --> N6601
  N6602[Class: AuthService]:::cls
  N6601 --> N6602
  N6603[validateCredentials()]:::mth
  N6602 --> N6603
  N6604[generateToken()]:::mth
  N6602 --> N6604
  N6605[verifyToken()]:::mth
  N6602 --> N6605
  N6607[File: EncryptionError.ts]:::file
  N6574 --> N6607
  N6608[Class: EncryptionError]:::cls
  N6607 --> N6608
  N6611[File: SecurityMiddleware.ts]:::file
  N6574 --> N6611
  N6612[Class: SecurityMiddleware]:::cls
  N6611 --> N6612
  N6613[use()]:::mth
  N6612 --> N6613
  N6614[extractToken()]:::mth
  N6612 --> N6614
  N6615[getResourceFromRequest()]:::mth
  N6612 --> N6615
  N6616[getActionFromRequest()]:::mth
  N6612 --> N6616
  N6625[File: index.ts]:::file
  N6574 --> N6625
  N6626[Class: RateLimitingService]:::cls
  N6625 --> N6626
  N6627[checkRateLimit()]:::mth
  N6626 --> N6627
  N6628[isAllowed()]:::mth
  N6626 --> N6628
  N6629[getKey()]:::mth
  N6626 --> N6629
  N6630[cleanup()]:::mth
  N6626 --> N6630
  N6631[File: SessionManager.ts]:::file
  N6574 --> N6631
  N6632[Class: SessionManager]:::cls
  N6631 --> N6632
  N6633[createSession()]:::mth
  N6632 --> N6633
  N6634[getSession()]:::mth
  N6632 --> N6634
  N6635[updateSession()]:::mth
  N6632 --> N6635
  N6636[destroySession()]:::mth
  N6632 --> N6636
  N6643[shared]:::pkg
  TNF --> N6643
  N6661[File: redis.ts]:::file
  N6643 --> N6661
  N6662[Class: RedisClient]:::cls
  N6661 --> N6662
  N6663[getInstance()]:::mth
  N6662 --> N6663
  N6664[connect()]:::mth
  N6662 --> N6664
  N6665[disconnect()]:::mth
  N6662 --> N6665
  N6666[set()]:::mth
  N6662 --> N6666
  N6667[get()]:::mth
  N6662 --> N6667
  N6668[File: index.ts]:::file
  N6643 --> N6668
  N6669[Class: with]:::cls
  N6668 --> N6669
  N6670[email()]:::mth
  N6669 --> N6670
  N6671[url()]:::mth
  N6669 --> N6671
  N6672[required()]:::mth
  N6669 --> N6672
  N6673[minLength()]:::mth
  N6669 --> N6673
  N6674[maxLength()]:::mth
  N6669 --> N6674
  N6675[Class: Validators]:::cls
  N6668 --> N6675
  N6676[email()]:::mth
  N6675 --> N6676
  N6677[url()]:::mth
  N6675 --> N6677
  N6678[required()]:::mth
  N6675 --> N6678
  N6679[minLength()]:::mth
  N6675 --> N6679
  N6680[maxLength()]:::mth
  N6675 --> N6680
  N6684[shared-utils]:::pkg
  TNF --> N6684
  N6686[sync-core]:::pkg
  TNF --> N6686
  N6687[File: advanced-multi-service.ts]:::file
  N6686 --> N6687
  N6688[Class: DistributedWorkflowService]:::cls
  N6687 --> N6688
  N6689[onModuleInit()]:::mth
  N6688 --> N6689
  N6690[subscribeToWorkflowEvents()]:::mth
  N6688 --> N6690
  N6691[executeWorkflow()]:::mth
  N6688 --> N6691
  N6692[executeNextStep()]:::mth
  N6688 --> N6692
  N6693[executeStep()]:::mth
  N6688 --> N6693
  N6694[File: agent-state-sync.ts]:::file
  N6686 --> N6694
  N6695[Class: AgentCoordinationService]:::cls
  N6694 --> N6695
  N6696[updateAgentStatus()]:::mth
  N6695 --> N6696
  N6697[startAgentTask()]:::mth
  N6695 --> N6697
  N6698[updateTaskProgress()]:::mth
  N6695 --> N6698
  N6699[completeAgentTask()]:::mth
  N6695 --> N6699
  N6700[handleAgentError()]:::mth
  N6695 --> N6700
  N6701[File: basic-integration.ts]:::file
  N6686 --> N6701
  N6702[Class: UserService]:::cls
  N6701 --> N6702
  N6703[onModuleInit()]:::mth
  N6702 --> N6703
  N6704[updateUser()]:::mth
  N6702 --> N6704
  N6705[handleUserSync()]:::mth
  N6702 --> N6705
  N6706[bulkUpdateUsers()]:::mth
  N6702 --> N6706
  N6707[File: conflict-resolution.ts]:::file
  N6686 --> N6707
  N6708[Class: DocumentSyncService]:::cls
  N6707 --> N6708
  N6709[registerConflictResolvers()]:::mth
  N6708 --> N6709
  N6710[updateDocument()]:::mth
  N6708 --> N6710
  N6711[handleConflict()]:::mth
  N6708 --> N6711
  N6712[detectConflictType()]:::mth
  N6708 --> N6712
  N6713[resolveByLatestTimestamp()]:::mth
  N6708 --> N6713
  N6714[File: file-watching-cms-sync.ts]:::file
  N6686 --> N6714
  N6715[Class: CMSSyncService]:::cls
  N6714 --> N6715
  N6716[onModuleInit()]:::mth
  N6715 --> N6716
  N6717[initializeFileWatching()]:::mth
  N6715 --> N6717
  N6718[handleContentChange()]:::mth
  N6715 --> N6718
  N6719[handleConfigChange()]:::mth
  N6715 --> N6719
  N6720[syncContentFile()]:::mth
  N6715 --> N6720
  N6721[File: real-time-notifications.ts]:::file
  N6686 --> N6721
  N6722[Class: RealTimeNotificationService]:::cls
  N6721 --> N6722
  N6723[onModuleInit()]:::mth
  N6722 --> N6723
  N6724[subscribeToEvents()]:::mth
  N6722 --> N6724
  N6725[sendNotification()]:::mth
  N6722 --> N6725
  N6726[deliverNotification()]:::mth
  N6722 --> N6726
  N6727[broadcastSystemNotification()]:::mth
  N6722 --> N6727
  N6731[File: CMSIntegrationService.ts]:::file
  N6686 --> N6731
  N6732[Class: CMSIntegrationService]:::cls
  N6731 --> N6732
  N6733[initialize()]:::mth
  N6732 --> N6733
  N6734[createPersonalContent()]:::mth
  N6732 --> N6734
  N6735[createProjectConfiguration()]:::mth
  N6732 --> N6735
  N6736[shareContent()]:::mth
  N6732 --> N6736
  N6737[addProjectCollaborator()]:::mth
  N6732 --> N6737
  N6738[File: CollaborativeContentService.ts]:::file
  N6686 --> N6738
  N6739[Class: CollaborativeContentService]:::cls
  N6738 --> N6739
  N6740[shareContent()]:::mth
  N6739 --> N6740
  N6741[addProjectCollaborator()]:::mth
  N6739 --> N6741
  N6742[getSharedContent()]:::mth
  N6739 --> N6742
  N6743[getCollaborativeProjects()]:::mth
  N6739 --> N6743
  N6744[revokeContentSharing()]:::mth
  N6739 --> N6744
  N6745[File: PersonalContentManager.ts]:::file
  N6686 --> N6745
  N6746[Class: PersonalContentManager]:::cls
  N6745 --> N6746
  N6747[createPersonalContent()]:::mth
  N6746 --> N6747
  N6748[updatePersonalContent()]:::mth
  N6746 --> N6748
  N6749[getPersonalContent()]:::mth
  N6746 --> N6749
  N6750[listPersonalContent()]:::mth
  N6746 --> N6750
  N6751[deletePersonalContent()]:::mth
  N6746 --> N6751
  N6752[File: PrivateDataIsolationService.ts]:::file
  N6686 --> N6752
  N6753[Class: PrivateDataIsolationService]:::cls
  N6752 --> N6753
  N6754[createPrivacyBoundary()]:::mth
  N6753 --> N6754
  N6755[validateDataAccess()]:::mth
  N6753 --> N6755
  N6756[isolatePrivateContent()]:::mth
  N6753 --> N6756
  N6757[auditPrivacyCompliance()]:::mth
  N6753 --> N6757
  N6758[encryptSensitiveData()]:::mth
  N6753 --> N6758
  N6759[File: ProjectConfigurationSync.ts]:::file
  N6686 --> N6759
  N6760[Class: ProjectConfigurationSync]:::cls
  N6759 --> N6760
  N6761[createProjectConfiguration()]:::mth
  N6760 --> N6761
  N6762[updateProjectConfiguration()]:::mth
  N6760 --> N6762
  N6763[getProjectConfiguration()]:::mth
  N6760 --> N6763
  N6764[listProjectConfigurations()]:::mth
  N6760 --> N6764
  N6765[syncConfigurationFiles()]:::mth
  N6760 --> N6765
  N6769[File: SyncRedisConfig.ts]:::file
  N6686 --> N6769
  N6770[Class: SyncRedisConfig]:::cls
  N6769 --> N6770
  N6771[setex()]:::mth
  N6770 --> N6771
  N6772[getKeyspatterns()]:::mth
  N6770 --> N6772
  N6773[getTTLConfig()]:::mth
  N6770 --> N6773
  N6774[getSyncRedisConfig()]:::mth
  N6770 --> N6774
  N6775[validateTenantId()]:::mth
  N6770 --> N6775
  N6776[File: DashboardMonitoringIntegration.ts]:::file
  N6686 --> N6776
  N6777[Class: DashboardMonitoringIntegration]:::cls
  N6776 --> N6777
  N6778[recordMetric()]:::mth
  N6777 --> N6778
  N6779[collectMetric()]:::mth
  N6777 --> N6779
  N6780[emit()]:::mth
  N6777 --> N6780
  N6781[onModuleInit()]:::mth
  N6777 --> N6781
  N6782[setupMonitoringIntegration()]:::mth
  N6777 --> N6782
  N6783[File: DashboardWebSocketIntegration.ts]:::file
  N6686 --> N6783
  N6784[Class: DashboardWebSocketIntegration]:::cls
  N6783 --> N6784
  N6785[onModuleInit()]:::mth
  N6784 --> N6785
  N6786[broadcastDashboardUpdate()]:::mth
  N6784 --> N6786
  N6787[sendToUserSessions()]:::mth
  N6784 --> N6787
  N6788[broadcastToTenant()]:::mth
  N6784 --> N6788
  N6789[broadcastToAll()]:::mth
  N6784 --> N6789
  N6790[File: SyncDashboard.example.ts]:::file
  N6686 --> N6790
  N6791[Class: ExistingAgentWebSocketServiceAdapter]:::cls
  N6790 --> N6791
  N6792[broadcastToTenant()]:::mth
  N6791 --> N6792
  N6793[broadcastToAll()]:::mth
  N6791 --> N6793
  N6794[sendToUser()]:::mth
  N6791 --> N6794
  N6795[recordMetric()]:::mth
  N6791 --> N6795
  N6796[getSystemHealth()]:::mth
  N6791 --> N6796
  N6797[Class: ExistingMonitoringServiceAdapter]:::cls
  N6790 --> N6797
  N6798[broadcastToTenant()]:::mth
  N6797 --> N6798
  N6799[broadcastToAll()]:::mth
  N6797 --> N6799
  N6800[sendToUser()]:::mth
  N6797 --> N6800
  N6801[recordMetric()]:::mth
  N6797 --> N6801
  N6802[getSystemHealth()]:::mth
  N6797 --> N6802
  N6803[Class: SyncDashboardModule]:::cls
  N6790 --> N6803
  N6804[broadcastToTenant()]:::mth
  N6803 --> N6804
  N6805[broadcastToAll()]:::mth
  N6803 --> N6805
  N6806[sendToUser()]:::mth
  N6803 --> N6806
  N6807[recordMetric()]:::mth
  N6803 --> N6807
  N6808[getSystemHealth()]:::mth
  N6803 --> N6808
  N6809[Class: ExampleBackendIntegration]:::cls
  N6790 --> N6809
  N6810[broadcastToTenant()]:::mth
  N6809 --> N6810
  N6811[broadcastToAll()]:::mth
  N6809 --> N6811
  N6812[sendToUser()]:::mth
  N6809 --> N6812
  N6813[recordMetric()]:::mth
  N6809 --> N6813
  N6814[getSystemHealth()]:::mth
  N6809 --> N6814
  N6815[Class: DashboardWebSocketClient]:::cls
  N6790 --> N6815
  N6816[broadcastToTenant()]:::mth
  N6815 --> N6816
  N6817[broadcastToAll()]:::mth
  N6815 --> N6817
  N6818[sendToUser()]:::mth
  N6815 --> N6818
  N6819[recordMetric()]:::mth
  N6815 --> N6819
  N6820[getSystemHealth()]:::mth
  N6815 --> N6820
  N6823[File: SyncDashboardService.ts]:::file
  N6686 --> N6823
  N6824[Class: SyncDashboardService]:::cls
  N6823 --> N6824
  N6825[broadcastToTenant()]:::mth
  N6824 --> N6825
  N6826[recordMetric()]:::mth
  N6824 --> N6826
  N6827[onModuleInit()]:::mth
  N6824 --> N6827
  N6828[onModuleDestroy()]:::mth
  N6824 --> N6828
  N6829[initialize()]:::mth
  N6824 --> N6829
  N6833[File: SyncDatabaseService.ts]:::file
  N6686 --> N6833
  N6834[Class: SyncDatabaseService]:::cls
  N6833 --> N6834
  N6835[upsertSyncState()]:::mth
  N6834 --> N6835
  N6836[getSyncState()]:::mth
  N6834 --> N6836
  N6837[getTenantSyncStates()]:::mth
  N6834 --> N6837
  N6838[getSyncStatesByType()]:::mth
  N6834 --> N6838
  N6839[deleteSyncState()]:::mth
  N6834 --> N6839
  N6840[File: HealthController.ts]:::file
  N6686 --> N6840
  N6841[Class: HealthController]:::cls
  N6840 --> N6841
  N6842[checkHealth()]:::mth
  N6841 --> N6842
  N6843[readinessProbe()]:::mth
  N6841 --> N6843
  N6844[startupProbe()]:::mth
  N6841 --> N6844
  N6845[detailedHealth()]:::mth
  N6841 --> N6845
  N6846[healthHistory()]:::mth
  N6841 --> N6846
  N6847[File: MetricsController.ts]:::file
  N6686 --> N6847
  N6848[Class: MetricsController]:::cls
  N6847 --> N6848
  N6849[getJsonMetrics()]:::mth
  N6848 --> N6849
  N6850[getCurrentMetrics()]:::mth
  N6848 --> N6850
  N6851[parseInt()]:::mth
  N6848 --> N6851
  N6852[getOperationMetrics()]:::mth
  N6848 --> N6852
  N6853[getPerformanceMetrics()]:::mth
  N6848 --> N6853
  N6854[File: SyncConfigService.ts]:::file
  N6686 --> N6854
  N6855[Class: SyncConfigService]:::cls
  N6854 --> N6855
  N6856[loadConfiguration()]:::mth
  N6855 --> N6856
  N6857[startConfigWatcher()]:::mth
  N6855 --> N6857
  N6858[hasConfigChanged()]:::mth
  N6855 --> N6858
  N6859[getConfig()]:::mth
  N6855 --> N6859
  N6860[getMasterClockConfig()]:::mth
  N6855 --> N6860
  N6861[File: SyncController.ts]:::file
  N6686 --> N6861
  N6862[Class: SyncController]:::cls
  N6861 --> N6862
  N6863[getStatus()]:::mth
  N6862 --> N6863
  N6864[forceClockSync()]:::mth
  N6862 --> N6864
  N6865[getClockStatus()]:::mth
  N6862 --> N6865
  N6866[getWatcherStatus()]:::mth
  N6862 --> N6866
  N6867[getConfig()]:::mth
  N6862 --> N6867
  N6868[File: SyncHealthService.ts]:::file
  N6686 --> N6868
  N6869[Class: SyncHealthService]:::cls
  N6868 --> N6869
  N6870[startHealthMonitoring()]:::mth
  N6869 --> N6870
  N6871[checkHealth()]:::mth
  N6869 --> N6871
  N6872[checkMasterClockHealth()]:::mth
  N6869 --> N6872
  N6873[checkFileWatcherHealth()]:::mth
  N6869 --> N6873
  N6874[checkOrchestratorHealth()]:::mth
  N6869 --> N6874
  N6875[File: SyncMetricsService.ts]:::file
  N6686 --> N6875
  N6876[Class: SyncMetricsService]:::cls
  N6875 --> N6876
  N6877[initializeMetrics()]:::mth
  N6876 --> N6877
  N6878[initialize()]:::mth
  N6876 --> N6878
  N6879[start()]:::mth
  N6876 --> N6879
  N6880[stop()]:::mth
  N6876 --> N6880
  N6881[collectMetrics()]:::mth
  N6876 --> N6881
  N6882[File: SyncModule.ts]:::file
  N6686 --> N6882
  N6883[Class: SyncModule]:::cls
  N6882 --> N6883
  N6884[initializeModule()]:::mth
  N6883 --> N6884
  N6885[File: SyncServer.ts]:::file
  N6686 --> N6885
  N6886[Class: SyncServer]:::cls
  N6885 --> N6886
  N6887[start()]:::mth
  N6886 --> N6887
  N6888[configureApp()]:::mth
  N6886 --> N6888
  N6889[setupHealthChecks()]:::mth
  N6886 --> N6889
  N6890[setupMetrics()]:::mth
  N6886 --> N6890
  N6891[setupGracefulShutdown()]:::mth
  N6886 --> N6891
  N6893[File: SyncErrorHandler.example.ts]:::file
  N6686 --> N6893
  N6894[Class: SyncErrorHandlingExample]:::cls
  N6893 --> N6894
  N6895[setupErrorHandling()]:::mth
  N6894 --> N6895
  N6896[setupEventHandlers()]:::mth
  N6894 --> N6896
  N6897[setupCustomStrategies()]:::mth
  N6894 --> N6897
  N6898[handleSyncError()]:::mth
  N6894 --> N6898
  N6899[getErrorHandlingHealth()]:::mth
  N6894 --> N6899
  N6900[Class: ExampleSyncService]:::cls
  N6893 --> N6900
  N6901[setupErrorHandling()]:::mth
  N6900 --> N6901
  N6902[setupEventHandlers()]:::mth
  N6900 --> N6902
  N6903[setupCustomStrategies()]:::mth
  N6900 --> N6903
  N6904[handleSyncError()]:::mth
  N6900 --> N6904
  N6905[getErrorHandlingHealth()]:::mth
  N6900 --> N6905
  N6908[File: SyncErrorHandler.ts]:::file
  N6686 --> N6908
  N6909[Class: SyncErrorHandler]:::cls
  N6908 --> N6909
  N6910[handleSyncError()]:::mth
  N6909 --> N6910
  N6911[queueFallbackOperation()]:::mth
  N6909 --> N6911
  N6912[processFallbackQueue()]:::mth
  N6909 --> N6912
  N6913[getSyncStatistics()]:::mth
  N6909 --> N6913
  N6914[clearSyncHistory()]:::mth
  N6909 --> N6914
  N6915[File: SyncFallbackProcessor.ts]:::file
  N6686 --> N6915
  N6916[Class: SyncFallbackProcessor]:::cls
  N6915 --> N6916
  N6917[registerStrategy()]:::mth
  N6916 --> N6917
  N6918[registerAlternativeAction()]:::mth
  N6916 --> N6918
  N6919[processFallbackOperation()]:::mth
  N6916 --> N6919
  N6920[getStatistics()]:::mth
  N6916 --> N6920
  N6921[getStrategies()]:::mth
  N6916 --> N6921
  N6923[File: SyncRetryManager.ts]:::file
  N6686 --> N6923
  N6924[Class: SyncRetryManager]:::cls
  N6923 --> N6924
  N6925[scheduleRetry()]:::mth
  N6924 --> N6925
  N6926[processRetries()]:::mth
  N6924 --> N6926
  N6927[getStatistics()]:::mth
  N6924 --> N6927
  N6928[getCircuitBreakerStates()]:::mth
  N6924 --> N6928
  N6929[resetCircuitBreaker()]:::mth
  N6924 --> N6929
  N6931[File: EnhancedAgentHandoffTemplateService.ts]:::file
  N6686 --> N6931
  N6932[Class: EnhancedAgentHandoffTemplateService]:::cls
  N6931 --> N6932
  N6933[createTemplate()]:::mth
  N6932 --> N6933
  N6934[createHandoffPrompt()]:::mth
  N6932 --> N6934
  N6935[createEnhancedHandoffTemplate()]:::mth
  N6932 --> N6935
  N6936[updateHandoffTemplate()]:::mth
  N6932 --> N6936
  N6937[initiateHandoffSession()]:::mth
  N6932 --> N6937
  N6940[File: PromptHandoffFlywheel.simple.test.ts]:::file
  N6686 --> N6940
  N6941[Class: MockSyncOrchestrator]:::cls
  N6940 --> N6941
  N6942[syncGlobalData()]:::mth
  N6941 --> N6942
  N6943[syncAgentState()]:::mth
  N6941 --> N6943
  N6944[now()]:::mth
  N6941 --> N6944
  N6945[Class: MockMasterClockService]:::cls
  N6940 --> N6945
  N6946[syncGlobalData()]:::mth
  N6945 --> N6946
  N6947[syncAgentState()]:::mth
  N6945 --> N6947
  N6948[now()]:::mth
  N6945 --> N6948
  N6949[Class: MockConflictManager]:::cls
  N6940 --> N6949
  N6950[syncGlobalData()]:::mth
  N6949 --> N6950
  N6951[syncAgentState()]:::mth
  N6949 --> N6951
  N6952[now()]:::mth
  N6949 --> N6952
  N6954[File: PromptHandoffFlywheel.ts]:::file
  N6686 --> N6954
  N6955[Class: PromptHandoffFlywheel]:::cls
  N6954 --> N6955
  N6956[initiateHandoff()]:::mth
  N6955 --> N6956
  N6957[updateHandoffTemplate()]:::mth
  N6955 --> N6957
  N6958[processHandoff()]:::mth
  N6955 --> N6958
  N6959[handleHandoffFailure()]:::mth
  N6955 --> N6959
  N6960[executeHandoff()]:::mth
  N6955 --> N6960
  N6961[File: PromptTemplateIntegration.ts]:::file
  N6686 --> N6961
  N6962[Class: PromptTemplateIntegration]:::cls
  N6961 --> N6962
  N6963[createTemplate()]:::mth
  N6962 --> N6963
  N6964[integrateTemplate()]:::mth
  N6962 --> N6964
  N6965[syncTemplate()]:::mth
  N6962 --> N6965
  N6966[syncHandoffToBase()]:::mth
  N6962 --> N6966
  N6967[syncBaseToHandoff()]:::mth
  N6962 --> N6967
  N6974[File: CommunicationHubFailover.ts]:::file
  N6686 --> N6974
  N6975[Class: CommunicationHubFailover]:::cls
  N6974 --> N6975
  N6976[onModuleInit()]:::mth
  N6975 --> N6976
  N6977[onModuleDestroy()]:::mth
  N6975 --> N6977
  N6978[configureFailover()]:::mth
  N6975 --> N6978
  N6979[registerNode()]:::mth
  N6975 --> N6979
  N6980[deliverWithFailover()]:::mth
  N6975 --> N6980
  N6981[File: MessageQueueSynchronizer.ts]:::file
  N6686 --> N6981
  N6982[Class: MessageQueueSynchronizer]:::cls
  N6981 --> N6982
  N6983[onModuleInit()]:::mth
  N6982 --> N6983
  N6984[onModuleDestroy()]:::mth
  N6982 --> N6984
  N6985[configureQueueSync()]:::mth
  N6982 --> N6985
  N6986[synchronizeQueue()]:::mth
  N6982 --> N6986
  N6987[synchronizeAllQueues()]:::mth
  N6982 --> N6987
  N6989[File: SyncAwareA2AMessage.ts]:::file
  N6686 --> N6989
  N6990[Class: SyncAwareMessageUtils]:::cls
  N6989 --> N6990
  N6991[createSyncMetadata()]:::mth
  N6990 --> N6991
  N6992[toSyncAware()]:::mth
  N6990 --> N6992
  N6993[extractSyncMetadata()]:::mth
  N6990 --> N6993
  N6994[allowsCrossTenant()]:::mth
  N6990 --> N6994
  N6995[getTenantId()]:::mth
  N6990 --> N6995
  N6996[File: SyncAwareAgentWebSocketService.ts]:::file
  N6686 --> N6996
  N6997[Class: SyncAwareAgentWebSocketService]:::cls
  N6996 --> N6997
  N6998[sendMessage()]:::mth
  N6997 --> N6998
  N6999[onModuleInit()]:::mth
  N6997 --> N6999
  N7000[onModuleDestroy()]:::mth
  N6997 --> N7000
  N7001[sendSyncAwareMessage()]:::mth
  N6997 --> N7001
  N7002[broadcastToTenantSync()]:::mth
  N6997 --> N7002
  N7006[File: SyncAwareMessagingService.ts]:::file
  N6686 --> N7006
  N7007[Class: SyncAwareMessagingService]:::cls
  N7006 --> N7007
  N7008[onModuleInit()]:::mth
  N7007 --> N7008
  N7009[onModuleDestroy()]:::mth
  N7007 --> N7009
  N7010[sendMessage()]:::mth
  N7007 --> N7010
  N7011[broadcastMessage()]:::mth
  N7007 --> N7011
  N7012[configureCrossTenantMessaging()]:::mth
  N7007 --> N7012
  N7014[File: SyncAwareHeartbeatMonitoringService.test.ts]:::file
  N6686 --> N7014
  N7015[Class: MockHeartbeatMonitoringService]:::cls
  N7014 --> N7015
  N7016[registerAgent()]:::mth
  N7015 --> N7016
  N7017[recordHeartbeat()]:::mth
  N7015 --> N7017
  N7018[getAgentHeartbeat()]:::mth
  N7015 --> N7018
  N7019[getMonitoringStatus()]:::mth
  N7015 --> N7019
  N7020[now()]:::mth
  N7015 --> N7020
  N7021[Class: MockMasterClockService]:::cls
  N7014 --> N7021
  N7022[registerAgent()]:::mth
  N7021 --> N7022
  N7023[recordHeartbeat()]:::mth
  N7021 --> N7023
  N7024[getAgentHeartbeat()]:::mth
  N7021 --> N7024
  N7025[getMonitoringStatus()]:::mth
  N7021 --> N7025
  N7026[now()]:::mth
  N7021 --> N7026
  N7027[Class: MockSyncOrchestrator]:::cls
  N7014 --> N7027
  N7028[registerAgent()]:::mth
  N7027 --> N7028
  N7029[recordHeartbeat()]:::mth
  N7027 --> N7029
  N7030[getAgentHeartbeat()]:::mth
  N7027 --> N7030
  N7031[getMonitoringStatus()]:::mth
  N7027 --> N7031
  N7032[now()]:::mth
  N7027 --> N7032
  N7033[Class: MockConflictManager]:::cls
  N7014 --> N7033
  N7034[registerAgent()]:::mth
  N7033 --> N7034
  N7035[recordHeartbeat()]:::mth
  N7033 --> N7035
  N7036[getAgentHeartbeat()]:::mth
  N7033 --> N7036
  N7037[getMonitoringStatus()]:::mth
  N7033 --> N7037
  N7038[now()]:::mth
  N7033 --> N7038
  N7039[File: SyncAwareHeartbeatMonitoringService.ts]:::file
  N6686 --> N7039
  N7040[Class: SyncAwareHeartbeatMonitoringService]:::cls
  N7039 --> N7040
  N7041[onModuleInit()]:::mth
  N7040 --> N7041
  N7042[setupHeartbeatIntegration()]:::mth
  N7040 --> N7042
  N7043[setupSyncIntegration()]:::mth
  N7040 --> N7043
  N7044[startSyncHealthMonitoring()]:::mth
  N7040 --> N7044
  N7045[handleHeartbeatReceived()]:::mth
  N7040 --> N7045
  N7046[File: SyncAwareMonitoring.example.ts]:::file
  N6686 --> N7046
  N7047[Class: BasicSyncMonitoringExample]:::cls
  N7046 --> N7047
  N7048[setupBasicMonitoring()]:::mth
  N7047 --> N7048
  N7049[handleSyncFailureEscalation()]:::mth
  N7047 --> N7049
  N7050[handleConflictStormEscalation()]:::mth
  N7047 --> N7050
  N7051[handleClockDriftEscalation()]:::mth
  N7047 --> N7051
  N7052[handleCriticalSystemHealth()]:::mth
  N7047 --> N7052
  N7053[Class: CustomMetricsIntegrationExample]:::cls
  N7046 --> N7053
  N7054[setupBasicMonitoring()]:::mth
  N7053 --> N7054
  N7055[handleSyncFailureEscalation()]:::mth
  N7053 --> N7055
  N7056[handleConflictStormEscalation()]:::mth
  N7053 --> N7056
  N7057[handleClockDriftEscalation()]:::mth
  N7053 --> N7057
  N7058[handleCriticalSystemHealth()]:::mth
  N7053 --> N7058
  N7059[Class: DashboardVisualizationExample]:::cls
  N7046 --> N7059
  N7060[setupBasicMonitoring()]:::mth
  N7059 --> N7060
  N7061[handleSyncFailureEscalation()]:::mth
  N7059 --> N7061
  N7062[handleConflictStormEscalation()]:::mth
  N7059 --> N7062
  N7063[handleClockDriftEscalation()]:::mth
  N7059 --> N7063
  N7064[handleCriticalSystemHealth()]:::mth
  N7059 --> N7064
  N7065[Class: AutomatedRecoveryExample]:::cls
  N7046 --> N7065
  N7066[setupBasicMonitoring()]:::mth
  N7065 --> N7066
  N7067[handleSyncFailureEscalation()]:::mth
  N7065 --> N7067
  N7068[handleConflictStormEscalation()]:::mth
  N7065 --> N7068
  N7069[handleClockDriftEscalation()]:::mth
  N7065 --> N7069
  N7070[handleCriticalSystemHealth()]:::mth
  N7065 --> N7070
  N7071[Class: SyncAwareMonitoringModule]:::cls
  N7046 --> N7071
  N7072[setupBasicMonitoring()]:::mth
  N7071 --> N7072
  N7073[handleSyncFailureEscalation()]:::mth
  N7071 --> N7073
  N7074[handleConflictStormEscalation()]:::mth
  N7071 --> N7074
  N7075[handleClockDriftEscalation()]:::mth
  N7071 --> N7075
  N7076[handleCriticalSystemHealth()]:::mth
  N7071 --> N7076
  N7077[File: SyncAwareMonitoring.integration.test.ts]:::file
  N6686 --> N7077
  N7078[Class: MockHeartbeatMonitoringService]:::cls
  N7077 --> N7078
  N7079[registerAgent()]:::mth
  N7078 --> N7079
  N7080[recordHeartbeat()]:::mth
  N7078 --> N7080
  N7081[getMonitoringStatus()]:::mth
  N7078 --> N7081
  N7082[now()]:::mth
  N7078 --> N7082
  N7083[getClockMetrics()]:::mth
  N7078 --> N7083
  N7084[Class: MockMasterClockService]:::cls
  N7077 --> N7084
  N7085[registerAgent()]:::mth
  N7084 --> N7085
  N7086[recordHeartbeat()]:::mth
  N7084 --> N7086
  N7087[getMonitoringStatus()]:::mth
  N7084 --> N7087
  N7088[now()]:::mth
  N7084 --> N7088
  N7089[getClockMetrics()]:::mth
  N7084 --> N7089
  N7090[Class: MockSyncOrchestrator]:::cls
  N7077 --> N7090
  N7091[registerAgent()]:::mth
  N7090 --> N7091
  N7092[recordHeartbeat()]:::mth
  N7090 --> N7092
  N7093[getMonitoringStatus()]:::mth
  N7090 --> N7093
  N7094[now()]:::mth
  N7090 --> N7094
  N7095[getClockMetrics()]:::mth
  N7090 --> N7095
  N7096[Class: MockConflictManager]:::cls
  N7077 --> N7096
  N7097[registerAgent()]:::mth
  N7096 --> N7097
  N7098[recordHeartbeat()]:::mth
  N7096 --> N7098
  N7099[getMonitoringStatus()]:::mth
  N7096 --> N7099
  N7100[now()]:::mth
  N7096 --> N7100
  N7101[getClockMetrics()]:::mth
  N7096 --> N7101
  N7102[Class: MockRedisService]:::cls
  N7077 --> N7102
  N7103[registerAgent()]:::mth
  N7102 --> N7103
  N7104[recordHeartbeat()]:::mth
  N7102 --> N7104
  N7105[getMonitoringStatus()]:::mth
  N7102 --> N7105
  N7106[now()]:::mth
  N7102 --> N7106
  N7107[getClockMetrics()]:::mth
  N7102 --> N7107
  N7108[Class: MockRedisConfig]:::cls
  N7077 --> N7108
  N7109[registerAgent()]:::mth
  N7108 --> N7109
  N7110[recordHeartbeat()]:::mth
  N7108 --> N7110
  N7111[getMonitoringStatus()]:::mth
  N7108 --> N7111
  N7112[now()]:::mth
  N7108 --> N7112
  N7113[getClockMetrics()]:::mth
  N7108 --> N7113
  N7114[Class: MockMetricsService]:::cls
  N7077 --> N7114
  N7115[registerAgent()]:::mth
  N7114 --> N7115
  N7116[recordHeartbeat()]:::mth
  N7114 --> N7116
  N7117[getMonitoringStatus()]:::mth
  N7114 --> N7117
  N7118[now()]:::mth
  N7114 --> N7118
  N7119[getClockMetrics()]:::mth
  N7114 --> N7119
  N7120[File: SyncHealthDashboardIntegration.ts]:::file
  N6686 --> N7120
  N7121[Class: SyncHealthDashboardIntegration]:::cls
  N7120 --> N7121
  N7122[onModuleInit()]:::mth
  N7121 --> N7122
  N7123[setupSyncHealthIntegration()]:::mth
  N7121 --> N7123
  N7124[setupDashboardIntegration()]:::mth
  N7121 --> N7124
  N7125[setupDefaultAlerts()]:::mth
  N7121 --> N7125
  N7126[setupDefaultWidgets()]:::mth
  N7121 --> N7126
  N7127[File: UnifiedSyncHealthReporting.ts]:::file
  N6686 --> N7127
  N7128[Class: UnifiedSyncHealthReporting]:::cls
  N7127 --> N7128
  N7129[createPerformanceMetric()]:::mth
  N7128 --> N7129
  N7130[onModuleInit()]:::mth
  N7128 --> N7130
  N7131[setupHealthReporting()]:::mth
  N7128 --> N7131
  N7132[startReportingSchedules()]:::mth
  N7128 --> N7132
  N7133[generateRealTimeReport()]:::mth
  N7128 --> N7133
  N7136[File: FileChangeBatcher.ts]:::file
  N6686 --> N7136
  N7137[Class: FileChangeBatcher]:::cls
  N7136 --> N7137
  N7138[addFileChange()]:::mth
  N7137 --> N7138
  N7139[processDebounced()]:::mth
  N7137 --> N7139
  N7140[addToBatch()]:::mth
  N7137 --> N7140
  N7141[processBatch()]:::mth
  N7137 --> N7141
  N7142[getChangeKey()]:::mth
  N7137 --> N7142
  N7143[File: HorizontalScalingCoordinator.ts]:::file
  N6686 --> N7143
  N7144[Class: HorizontalScalingCoordinator]:::cls
  N7143 --> N7144
  N7145[setex()]:::mth
  N7144 --> N7145
  N7146[initialize()]:::mth
  N7144 --> N7146
  N7147[registerInstance()]:::mth
  N7144 --> N7147
  N7148[startHeartbeat()]:::mth
  N7144 --> N7148
  N7149[sendHeartbeat()]:::mth
  N7144 --> N7149
  N7150[File: PerformanceOptimization.example.ts]:::file
  N6686 --> N7150
  N7151[Class: MockRedisService]:::cls
  N7150 --> N7151
  N7152[setex()]:::mth
  N7151 --> N7152
  N7153[get()]:::mth
  N7151 --> N7153
  N7154[sadd()]:::mth
  N7151 --> N7154
  N7155[smembers()]:::mth
  N7151 --> N7155
  N7156[srem()]:::mth
  N7151 --> N7156
  N7157[Class: MockMetricsService]:::cls
  N7150 --> N7157
  N7158[setex()]:::mth
  N7157 --> N7158
  N7159[get()]:::mth
  N7157 --> N7159
  N7160[sadd()]:::mth
  N7157 --> N7160
  N7161[smembers()]:::mth
  N7157 --> N7161
  N7162[srem()]:::mth
  N7157 --> N7162
  N7165[File: PerformanceOptimizationService.ts]:::file
  N6686 --> N7165
  N7166[Class: PerformanceOptimizationService]:::cls
  N7165 --> N7166
  N7167[setex()]:::mth
  N7166 --> N7167
  N7168[recordMetric()]:::mth
  N7166 --> N7168
  N7169[initialize()]:::mth
  N7166 --> N7169
  N7170[processFileChange()]:::mth
  N7166 --> N7170
  N7171[distributeWork()]:::mth
  N7166 --> N7171
  N7172[File: SyncLRUCache.ts]:::file
  N6686 --> N7172
  N7173[Class: SyncLRUCache]:::cls
  N7172 --> N7173
  N7174[get()]:::mth
  N7173 --> N7174
  N7175[set()]:::mth
  N7173 --> N7175
  N7176[delete()]:::mth
  N7173 --> N7176
  N7177[clearTenant()]:::mth
  N7173 --> N7177
  N7178[clear()]:::mth
  N7173 --> N7178
  N7179[File: SyncPerformanceTelemetry.ts]:::file
  N6686 --> N7179
  N7180[Class: SyncPerformanceTelemetry]:::cls
  N7179 --> N7180
  N7181[recordMetric()]:::mth
  N7180 --> N7181
  N7182[recordSyncOperation()]:::mth
  N7180 --> N7182
  N7183[startOperation()]:::mth
  N7180 --> N7183
  N7184[endOperation()]:::mth
  N7180 --> N7184
  N7185[recordSystemMetrics()]:::mth
  N7180 --> N7185
  N7188[File: AgentFlightRecorder.ts]:::file
  N6686 --> N7188
  N7189[Class: AgentFlightRecorder]:::cls
  N7188 --> N7189
  N7190[startSession()]:::mth
  N7189 --> N7190
  N7191[recordAction()]:::mth
  N7189 --> N7191
  N7192[endSession()]:::mth
  N7189 --> N7192
  N7193[getActiveSession()]:::mth
  N7189 --> N7193
  N7196[File: ConflictManager.ts]:::file
  N6686 --> N7196
  N7197[Class: ConflictManager]:::cls
  N7196 --> N7197
  N7198[initializeErrorHandling()]:::mth
  N7197 --> N7198
  N7199[detectConflict()]:::mth
  N7197 --> N7199
  N7200[resolveConflict()]:::mth
  N7197 --> N7200
  N7201[getPendingConflicts()]:::mth
  N7197 --> N7201
  N7202[getResourceConflicts()]:::mth
  N7197 --> N7202
  N7203[File: MasterClockService.example.ts]:::file
  N6686 --> N7203
  N7204[Class: MasterClockServiceFactory]:::cls
  N7203 --> N7204
  N7205[unsubscribe()]:::mth
  N7204 --> N7205
  N7206[publish()]:::mth
  N7204 --> N7206
  N7207[hset()]:::mth
  N7204 --> N7207
  N7208[emit()]:::mth
  N7204 --> N7208
  N7209[collectMetric()]:::mth
  N7204 --> N7209
  N7210[Class: ApplicationWithMasterClock]:::cls
  N7203 --> N7210
  N7211[unsubscribe()]:::mth
  N7210 --> N7211
  N7212[publish()]:::mth
  N7210 --> N7212
  N7213[hset()]:::mth
  N7210 --> N7213
  N7214[emit()]:::mth
  N7210 --> N7214
  N7215[collectMetric()]:::mth
  N7210 --> N7215
  N7217[File: MasterClockService.ts]:::file
  N6686 --> N7217
  N7218[Class: MasterClockService]:::cls
  N7217 --> N7218
  N7219[unsubscribe()]:::mth
  N7218 --> N7219
  N7220[emit()]:::mth
  N7218 --> N7220
  N7221[collectMetric()]:::mth
  N7218 --> N7221
  N7222[initialize()]:::mth
  N7218 --> N7222
  N7223[shutdown()]:::mth
  N7218 --> N7223
  N7224[File: SyncOrchestrator.example.ts]:::file
  N6686 --> N7224
  N7225[Class: SyncOrchestratorExamples]:::cls
  N7224 --> N7225
  N7226[syncAgentStatusChange()]:::mth
  N7225 --> N7226
  N7227[syncTenantConfiguration()]:::mth
  N7225 --> N7227
  N7228[syncGlobalPromptTemplates()]:::mth
  N7225 --> N7228
  N7229[syncTaskUpdates()]:::mth
  N7225 --> N7229
  N7230[syncWorkflowStateChanges()]:::mth
  N7225 --> N7230
  N7231[Class: DocumentService]:::cls
  N7224 --> N7231
  N7232[syncAgentStatusChange()]:::mth
  N7231 --> N7232
  N7233[syncTenantConfiguration()]:::mth
  N7231 --> N7233
  N7234[syncGlobalPromptTemplates()]:::mth
  N7231 --> N7234
  N7235[syncTaskUpdates()]:::mth
  N7231 --> N7235
  N7236[syncWorkflowStateChanges()]:::mth
  N7231 --> N7236
  N7237[Class: SyncErrorHandler]:::cls
  N7224 --> N7237
  N7238[syncAgentStatusChange()]:::mth
  N7237 --> N7238
  N7239[syncTenantConfiguration()]:::mth
  N7237 --> N7239
  N7240[syncGlobalPromptTemplates()]:::mth
  N7237 --> N7240
  N7241[syncTaskUpdates()]:::mth
  N7237 --> N7241
  N7242[syncWorkflowStateChanges()]:::mth
  N7237 --> N7242
  N7244[File: SyncOrchestrator.ts]:::file
  N6686 --> N7244
  N7245[Class: SyncOrchestrator]:::cls
  N7244 --> N7245
  N7246[sendMessage()]:::mth
  N7245 --> N7246
  N7247[onModuleInit()]:::mth
  N7245 --> N7247
  N7248[onModuleDestroy()]:::mth
  N7245 --> N7248
  N7249[initializeChannelSubscriptions()]:::mth
  N7245 --> N7249
  N7250[loadTenantContexts()]:::mth
  N7245 --> N7250
  N7251[File: WorkspaceMirrorService.ts]:::file
  N6686 --> N7251
  N7252[Class: WorkspaceMirrorService]:::cls
  N7251 --> N7252
  N7253[start()]:::mth
  N7252 --> N7253
  N7254[stop()]:::mth
  N7252 --> N7254
  N7255[connectToRemote()]:::mth
  N7252 --> N7255
  N7256[disconnectFromRemote()]:::mth
  N7252 --> N7256
  N7257[handleLocalChange()]:::mth
  N7252 --> N7257
  N7259[File: EnhancedTaskManagementService.ts]:::file
  N6686 --> N7259
  N7260[Class: EnhancedTaskManagementService]:::cls
  N7259 --> N7260
  N7261[onModuleInit()]:::mth
  N7260 --> N7261
  N7262[loadExistingTasks()]:::mth
  N7260 --> N7262
  N7263[loadWorkflowIntegrations()]:::mth
  N7260 --> N7263
  N7264[createTask()]:::mth
  N7260 --> N7264
  N7265[updateTask()]:::mth
  N7260 --> N7265
  N7266[File: TaskNotificationService.ts]:::file
  N6686 --> N7266
  N7267[Class: TaskNotificationService]:::cls
  N7266 --> N7267
  N7268[sendMessage()]:::mth
  N7267 --> N7268
  N7269[onModuleInit()]:::mth
  N7267 --> N7269
  N7270[onModuleDestroy()]:::mth
  N7267 --> N7270
  N7271[loadNotificationRules()]:::mth
  N7267 --> N7271
  N7272[initializeChannelSubscriptions()]:::mth
  N7267 --> N7272
  N7275[File: TaskSynchronizationService.ts]:::file
  N6686 --> N7275
  N7276[Class: TaskSynchronizationService]:::cls
  N7275 --> N7276
  N7277[sendMessage()]:::mth
  N7276 --> N7277
  N7278[onModuleInit()]:::mth
  N7276 --> N7278
  N7279[onModuleDestroy()]:::mth
  N7276 --> N7279
  N7280[initializeChannelSubscriptions()]:::mth
  N7276 --> N7280
  N7281[loadTaskDependencies()]:::mth
  N7276 --> N7281
  N7284[File: EnhancedFileSystemWatcher.example.ts]:::file
  N6686 --> N7284
  N7285[Class: FileWatcherModule]:::cls
  N7284 --> N7285
  N7286[setupEnhancedFileWatcher()]:::mth
  N7285 --> N7286
  N7287[setupMultiTenantWatching()]:::mth
  N7285 --> N7287
  N7288[integrateWithBrowserHubSync()]:::mth
  N7285 --> N7288
  N7289[setupConflictResolution()]:::mth
  N7285 --> N7289
  N7290[setupPerformanceMonitoring()]:::mth
  N7285 --> N7290
  N7293[File: EnhancedFileSystemWatcher.ts]:::file
  N6686 --> N7293
  N7294[Class: EnhancedFileSystemWatcher]:::cls
  N7293 --> N7294
  N7295[initialize()]:::mth
  N7294 --> N7295
  N7296[watchTenantFiles()]:::mth
  N7294 --> N7296
  N7297[watchGlobalFiles()]:::mth
  N7294 --> N7297
  N7298[setupWatcherEvents()]:::mth
  N7294 --> N7298
  N7299[handleFileChange()]:::mth
  N7294 --> N7299
  N7301[test-utils]:::pkg
  TNF --> N7301
  N7303[testing]:::pkg
  TNF --> N7303
  N7305[File: agent-workflow.test-suite.ts]:::file
  N7303 --> N7305
  N7306[Class: AgentWorkflowTestSuite]:::cls
  N7305 --> N7306
  N7307[addJob()]:::mth
  N7306 --> N7307
  N7308[getAgent()]:::mth
  N7306 --> N7308
  N7309[registerAgent()]:::mth
  N7306 --> N7309
  N7310[runAllTests()]:::mth
  N7306 --> N7310
  N7311[getTestScenarios()]:::mth
  N7306 --> N7311
  N7323[File: test-reporter.ts]:::file
  N7303 --> N7323
  N7324[Class: TestReporter]:::cls
  N7323 --> N7324
  N7325[captureScreenshot()]:::mth
  N7324 --> N7325
  N7326[startVideoRecording()]:::mth
  N7324 --> N7326
  N7327[stopVideoRecording()]:::mth
  N7324 --> N7327
  N7328[captureNetworkLogs()]:::mth
  N7324 --> N7328
  N7329[saveConsoleLog()]:::mth
  N7324 --> N7329
  N7330[File: visual-testing.ts]:::file
  N7303 --> N7330
  N7331[Class: VisualTesting]:::cls
  N7330 --> N7331
  N7332[getSnapshotPath()]:::mth
  N7331 --> N7332
  N7333[compareScreenshot()]:::mth
  N7331 --> N7333
  N7334[updateBaseline()]:::mth
  N7331 --> N7334
  N7335[compareElement()]:::mth
  N7331 --> N7335
  N7336[compareFullPage()]:::mth
  N7331 --> N7336
  N7344[File: jest-setup.ts]:::file
  N7303 --> N7344
  N7345[Class: IntersectionObserver]:::cls
  N7344 --> N7345
  N7346[disconnect()]:::mth
  N7345 --> N7346
  N7347[observe()]:::mth
  N7345 --> N7347
  N7348[takeRecords()]:::mth
  N7345 --> N7348
  N7349[unobserve()]:::mth
  N7345 --> N7349
  N7350[disconnect()]:::mth
  N7345 --> N7350
  N7351[Class: ResizeObserver]:::cls
  N7344 --> N7351
  N7352[disconnect()]:::mth
  N7351 --> N7352
  N7353[observe()]:::mth
  N7351 --> N7353
  N7354[takeRecords()]:::mth
  N7351 --> N7354
  N7355[unobserve()]:::mth
  N7351 --> N7355
  N7356[disconnect()]:::mth
  N7351 --> N7356
  N7357[File: vitest-setup.ts]:::file
  N7303 --> N7357
  N7358[Class: IntersectionObserver]:::cls
  N7357 --> N7358
  N7359[disconnect()]:::mth
  N7358 --> N7359
  N7360[observe()]:::mth
  N7358 --> N7360
  N7361[takeRecords()]:::mth
  N7358 --> N7361
  N7362[unobserve()]:::mth
  N7358 --> N7362
  N7363[disconnect()]:::mth
  N7358 --> N7363
  N7364[Class: ResizeObserver]:::cls
  N7357 --> N7364
  N7365[disconnect()]:::mth
  N7364 --> N7365
  N7366[observe()]:::mth
  N7364 --> N7366
  N7367[takeRecords()]:::mth
  N7364 --> N7367
  N7368[unobserve()]:::mth
  N7364 --> N7368
  N7369[disconnect()]:::mth
  N7364 --> N7369
  N7371[File: test-runner.controller.ts]:::file
  N7303 --> N7371
  N7372[Class: JwtAuthGuard]:::cls
  N7371 --> N7372
  N7373[runAgentWorkflowTests()]:::mth
  N7372 --> N7373
  N7374[runSingleTest()]:::mth
  N7372 --> N7374
  N7375[getAllTestRuns()]:::mth
  N7372 --> N7375
  N7376[getTestRunsByStatus()]:::mth
  N7372 --> N7376
  N7377[getTestRun()]:::mth
  N7372 --> N7377
  N7378[Class: class]:::cls
  N7371 --> N7378
  N7379[runAgentWorkflowTests()]:::mth
  N7378 --> N7379
  N7380[runSingleTest()]:::mth
  N7378 --> N7380
  N7381[getAllTestRuns()]:::mth
  N7378 --> N7381
  N7382[getTestRunsByStatus()]:::mth
  N7378 --> N7382
  N7383[getTestRun()]:::mth
  N7378 --> N7383
  N7384[Class: TestRunnerController]:::cls
  N7371 --> N7384
  N7385[runAgentWorkflowTests()]:::mth
  N7384 --> N7385
  N7386[runSingleTest()]:::mth
  N7384 --> N7386
  N7387[getAllTestRuns()]:::mth
  N7384 --> N7387
  N7388[getTestRunsByStatus()]:::mth
  N7384 --> N7388
  N7389[getTestRun()]:::mth
  N7384 --> N7389
  N7390[File: test-runner.service.ts]:::file
  N7303 --> N7390
  N7391[Class: TestRunnerService]:::cls
  N7390 --> N7391
  N7392[addJob()]:::mth
  N7391 --> N7392
  N7393[set()]:::mth
  N7391 --> N7393
  N7394[registerAgent()]:::mth
  N7391 --> N7394
  N7395[runAgentWorkflowTests()]:::mth
  N7391 --> N7395
  N7396[runSingleTest()]:::mth
  N7391 --> N7396
  N7397[File: testing.module.ts]:::file
  N7303 --> N7397
  N7398[Class: TestingModule]:::cls
  N7397 --> N7398
  N7399[File: nestjs-helpers.ts]:::file
  N7303 --> N7399
  N7400[Class: TestRequest]:::cls
  N7399 --> N7400
  N7401[createTestingModule()]:::mth
  N7400 --> N7401
  N7402[createTestApp()]:::mth
  N7400 --> N7402
  N7403[closeTestApp()]:::mth
  N7400 --> N7403
  N7404[get()]:::mth
  N7400 --> N7404
  N7405[post()]:::mth
  N7400 --> N7405
  N7406[File: test-helpers.ts]:::file
  N7303 --> N7406
  N7407[Class: extends]:::cls
  N7406 --> N7407
  N7408[sleep()]:::mth
  N7407 --> N7408
  N7409[flushPromises()]:::mth
  N7407 --> N7409
  N7410[randomString()]:::mth
  N7407 --> N7410
  N7411[randomEmail()]:::mth
  N7407 --> N7411
  N7412[randomUUID()]:::mth
  N7407 --> N7412
  N7413[tnf-cli]:::pkg
  TNF --> N7413
  N7414[File: RedisAgentClient.ts]:::file
  N7413 --> N7414
  N7415[Class: RedisAgentClient]:::cls
  N7414 --> N7415
  N7416[initialize()]:::mth
  N7415 --> N7416
  N7417[logRedisClientError()]:::mth
  N7415 --> N7417
  N7418[register()]:::mth
  N7415 --> N7418
  N7419[submitBid()]:::mth
  N7415 --> N7419
  N7420[getDefaultCapabilities()]:::mth
  N7415 --> N7420
  N7423[File: orchestration.ts]:::file
  N7413 --> N7423
  N7424[Class: Orchestrator]:::cls
  N7423 --> N7424
  N7425[executeWorkflow()]:::mth
  N7424 --> N7425
  N7426[runHealthCheck()]:::mth
  N7424 --> N7426
  N7427[runCodeReview()]:::mth
  N7424 --> N7427
  N7428[runSelfImprovement()]:::mth
  N7424 --> N7428
  N7429[File: ACPService.ts]:::file
  N7413 --> N7429
  N7430[Class: ACPService]:::cls
  N7429 --> N7430
  N7431[start()]:::mth
  N7430 --> N7431
  N7432[stop()]:::mth
  N7430 --> N7432
  N7433[handleHttpRequest()]:::mth
  N7430 --> N7433
  N7434[handleWebSocketConnection()]:::mth
  N7430 --> N7434
  N7435[handleACPMessage()]:::mth
  N7430 --> N7435
  N7436[File: AgentManagerService.ts]:::file
  N7413 --> N7436
  N7437[Class: AgentManagerService]:::cls
  N7436 --> N7437
  N7438[loadAgents()]:::mth
  N7437 --> N7438
  N7439[saveAgents()]:::mth
  N7437 --> N7439
  N7440[create()]:::mth
  N7437 --> N7440
  N7441[getDefaultCapabilities()]:::mth
  N7437 --> N7441
  N7442[list()]:::mth
  N7437 --> N7442
  N7443[File: AuthService.ts]:::file
  N7413 --> N7443
  N7444[Class: AuthService]:::cls
  N7443 --> N7444
  N7445[loadCredentials()]:::mth
  N7444 --> N7445
  N7446[saveCredentials()]:::mth
  N7444 --> N7446
  N7447[loadConfig()]:::mth
  N7444 --> N7447
  N7448[saveConfig()]:::mth
  N7444 --> N7448
  N7449[listProviders()]:::mth
  N7444 --> N7449
  N7451[File: DatabaseService.ts]:::file
  N7413 --> N7451
  N7452[Class: DatabaseService]:::cls
  N7451 --> N7452
  N7453[loadData()]:::mth
  N7452 --> N7453
  N7454[saveData()]:::mth
  N7452 --> N7454
  N7455[getPath()]:::mth
  N7452 --> N7455
  N7456[openInteractive()]:::mth
  N7452 --> N7456
  N7457[query()]:::mth
  N7452 --> N7457
  N7458[File: DebugService.ts]:::file
  N7413 --> N7458
  N7459[Class: DebugService]:::cls
  N7458 --> N7459
  N7460[getPaths()]:::mth
  N7459 --> N7460
  N7461[getConfig()]:::mth
  N7459 --> N7461
  N7462[getConfigPath()]:::mth
  N7459 --> N7462
  N7463[getProjectConfig()]:::mth
  N7459 --> N7463
  N7464[getProjectCommands()]:::mth
  N7459 --> N7464
  N7465[File: MCPManagerService.ts]:::file
  N7413 --> N7465
  N7466[Class: MCPManagerService]:::cls
  N7465 --> N7466
  N7467[loadConfig()]:::mth
  N7466 --> N7467
  N7468[loadCredentials()]:::mth
  N7466 --> N7468
  N7469[saveCredentials()]:::mth
  N7466 --> N7469
  N7470[addServer()]:::mth
  N7466 --> N7470
  N7471[saveConfig()]:::mth
  N7466 --> N7471
  N7472[File: MemoryService.ts]:::file
  N7413 --> N7472
  N7473[Class: MemoryService]:::cls
  N7472 --> N7473
  N7474[ensureTree()]:::mth
  N7473 --> N7474
  N7475[curate()]:::mth
  N7473 --> N7475
  N7476[format()]:::mth
  N7473 --> N7476
  N7477[query()]:::mth
  N7473 --> N7477
  N7478[Memory()]:::mth
  N7473 --> N7478
  N7479[File: ModelsService.ts]:::file
  N7413 --> N7479
  N7480[Class: ModelsService]:::cls
  N7479 --> N7480
  N7481[listProviders()]:::mth
  N7480 --> N7481
  N7482[listModels()]:::mth
  N7480 --> N7482
  N7483[fetchModels()]:::mth
  N7480 --> N7483
  N7484[loadCache()]:::mth
  N7480 --> N7484
  N7485[saveCache()]:::mth
  N7480 --> N7485
  N7486[File: PermissionService.ts]:::file
  N7413 --> N7486
  N7487[Class: PermissionService]:::cls
  N7486 --> N7487
  N7488[loadConfigFromPath()]:::mth
  N7487 --> N7488
  N7489[loadGlobalConfig()]:::mth
  N7487 --> N7489
  N7490[loadProjectConfig()]:::mth
  N7487 --> N7490
  N7491[matchPattern()]:::mth
  N7487 --> N7491
  N7492[checkRules()]:::mth
  N7487 --> N7492
  N7493[File: ProjectConfigService.ts]:::file
  N7413 --> N7493
  N7494[Class: ProjectConfigService]:::cls
  N7493 --> N7494
  N7495[loadConfig()]:::mth
  N7494 --> N7495
  N7496[loadCommandDefs()]:::mth
  N7494 --> N7496
  N7497[loadAgentDefs()]:::mth
  N7494 --> N7497
  N7498[getConfig()]:::mth
  N7494 --> N7498
  N7499[getCommands()]:::mth
  N7494 --> N7499
  N7500[File: RemoteService.ts]:::file
  N7413 --> N7500
  N7501[Class: RemoteService]:::cls
  N7500 --> N7501
  N7502[enable()]:::mth
  N7501 --> N7502
  N7503[disable()]:::mth
  N7501 --> N7503
  N7504[handleHttpRequest()]:::mth
  N7501 --> N7504
  N7505[handleWebSocketConnection()]:::mth
  N7501 --> N7505
  N7506[handleRelayMessage()]:::mth
  N7501 --> N7506
  N7507[File: ServeService.ts]:::file
  N7413 --> N7507
  N7508[Class: ServeService]:::cls
  N7507 --> N7508
  N7509[start()]:::mth
  N7508 --> N7509
  N7510[handleHttpRequest()]:::mth
  N7508 --> N7510
  N7511[handleWebSocketConnection()]:::mth
  N7508 --> N7511
  N7512[handleMessage()]:::mth
  N7508 --> N7512
  N7513[executeCommand()]:::mth
  N7508 --> N7513
  N7514[File: SessionManagerService.ts]:::file
  N7413 --> N7514
  N7515[Class: SessionManagerService]:::cls
  N7514 --> N7515
  N7516[loadSessionsIndex()]:::mth
  N7515 --> N7516
  N7517[saveSessionsIndex()]:::mth
  N7515 --> N7517
  N7518[list()]:::mth
  N7515 --> N7518
  N7519[get()]:::mth
  N7515 --> N7519
  N7520[create()]:::mth
  N7515 --> N7520
  N7521[File: SkillsService.ts]:::file
  N7413 --> N7521
  N7522[Class: SkillsService]:::cls
  N7521 --> N7522
  N7523[ensureBank()]:::mth
  N7522 --> N7523
  N7524[compile()]:::mth
  N7522 --> N7524
  N7525[format()]:::mth
  N7522 --> N7525
  N7526[listCompiled()]:::mth
  N7522 --> N7526
  N7527[File: StatsService.ts]:::file
  N7413 --> N7527
  N7528[Class: StatsService]:::cls
  N7527 --> N7528
  N7529[loadStats()]:::mth
  N7528 --> N7529
  N7530[saveStats()]:::mth
  N7528 --> N7530
  N7531[record()]:::mth
  N7528 --> N7531
  N7532[getSummary()]:::mth
  N7528 --> N7532
  N7533[close()]:::mth
  N7528 --> N7533
  N7534[File: UpgradeService.ts]:::file
  N7413 --> N7534
  N7535[Class: UpgradeService]:::cls
  N7534 --> N7535
  N7536[getCurrentVersion()]:::mth
  N7535 --> N7536
  N7537[getLatestVersion()]:::mth
  N7535 --> N7537
  N7538[getAvailableVersions()]:::mth
  N7535 --> N7538
  N7539[upgrade()]:::mth
  N7535 --> N7539
  N7540[detectInstallMethod()]:::mth
  N7535 --> N7540
  N7542[File: llm-client.ts]:::file
  N7413 --> N7542
  N7543[Class: LLMClient]:::cls
  N7542 --> N7543
  N7544[resolveProvider()]:::mth
  N7543 --> N7544
  N7545[chatComplete()]:::mth
  N7543 --> N7545
  N7546[callOpenAICompatible()]:::mth
  N7543 --> N7546
  N7547[Error()]:::mth
  N7543 --> N7547
  N7548[callGemini()]:::mth
  N7543 --> N7548
  N7550[tnf-core]:::pkg
  TNF --> N7550
  N7551[tnf-orchestrator-go]:::pkg
  TNF --> N7551
  N7552[types]:::pkg
  TNF --> N7552
  N7559[File: agent-communication.ts]:::file
  N7552 --> N7559
  N7560[Class: PriorityQueue]:::cls
  N7559 --> N7560
  N7561[enqueue()]:::mth
  N7560 --> N7561
  N7562[dequeue()]:::mth
  N7560 --> N7562
  N7563[peek()]:::mth
  N7560 --> N7563
  N7564[isEmpty()]:::mth
  N7560 --> N7564
  N7565[size()]:::mth
  N7560 --> N7565
  N7566[File: agent.ts]:::file
  N7552 --> N7566
  N7567[Class: that]:::cls
  N7566 --> N7567
  N7568[Class: Agent]:::cls
  N7566 --> N7568
  N7569[Class: export]:::cls
  N7566 --> N7569
  N7570[Class: CreateAgentDto]:::cls
  N7566 --> N7570
  N7571[Class: export]:::cls
  N7566 --> N7571
  N7572[Class: UpdateAgentDto]:::cls
  N7566 --> N7572
  N7573[Class: AgentResponseDto]:::cls
  N7566 --> N7573
  N7574[Class: AgentProfileDto]:::cls
  N7566 --> N7574
  N7584[File: communication.ts]:::file
  N7552 --> N7584
  N7585[Class: WebSocketError]:::cls
  N7584 --> N7585
  N7600[File: error.ts]:::file
  N7552 --> N7600
  N7601[Class: CustomError]:::cls
  N7600 --> N7601
  N7611[File: ioredis.ts]:::file
  N7552 --> N7611
  N7612[Class: RedisService]:::cls
  N7611 --> N7612
  N7613[executeTransaction()]:::mth
  N7612 --> N7613
  N7614[connect()]:::mth
  N7612 --> N7614
  N7615[exec()]:::mth
  N7612 --> N7615
  N7616[duplicate()]:::mth
  N7612 --> N7616
  N7617[executeTransaction()]:::mth
  N7612 --> N7617
  N7626[File: messaging.ts]:::file
  N7552 --> N7626
  N7627[Class: PriorityQueue]:::cls
  N7626 --> N7627
  N7628[enqueue()]:::mth
  N7627 --> N7628
  N7629[dequeue()]:::mth
  N7627 --> N7629
  N7630[isEmpty()]:::mth
  N7627 --> N7630
  N7631[size()]:::mth
  N7627 --> N7631
  N7666[ui-consolidated]:::pkg
  TNF --> N7666
  N7667[File: jest.setup.ts]:::file
  N7666 --> N7667
  N7668[Class: ResizeObserver]:::cls
  N7667 --> N7668
  N7669[observe()]:::mth
  N7668 --> N7669
  N7670[unobserve()]:::mth
  N7668 --> N7670
  N7671[disconnect()]:::mth
  N7668 --> N7671
  N7672[observe()]:::mth
  N7668 --> N7672
  N7673[unobserve()]:::mth
  N7668 --> N7673
  N7674[Class: IntersectionObserver]:::cls
  N7667 --> N7674
  N7675[observe()]:::mth
  N7674 --> N7675
  N7676[unobserve()]:::mth
  N7674 --> N7676
  N7677[disconnect()]:::mth
  N7674 --> N7677
  N7678[observe()]:::mth
  N7674 --> N7678
  N7679[unobserve()]:::mth
  N7674 --> N7679
  N7711[File: memory-graph-adapter.ts]:::file
  N7666 --> N7711
  N7712[Class: MemoryGraphAdapter]:::cls
  N7711 --> N7712
  N7713[addNodes()]:::mth
  N7712 --> N7713
  N7714[getSuggestedConnections()]:::mth
  N7712 --> N7714
  N7715[findSimilarNodes()]:::mth
  N7712 --> N7715
  N7716[getNodes()]:::mth
  N7712 --> N7716
  N7717[getNode()]:::mth
  N7712 --> N7717
  N7734[File: cn.ts]:::file
  N7666 --> N7734
  N7735[Class: names]:::cls
  N7734 --> N7735
  N7736[cn()]:::mth
  N7735 --> N7736
  N7737[Class: handling]:::cls
  N7734 --> N7737
  N7738[cn()]:::mth
  N7737 --> N7738
  N7741[utils]:::pkg
  TNF --> N7741
  N7751[File: Logger.ts]:::file
  N7741 --> N7751
  N7752[Class: Logger]:::cls
  N7751 --> N7752
  N7753[debug()]:::mth
  N7752 --> N7753
  N7754[info()]:::mth
  N7752 --> N7754
  N7755[warn()]:::mth
  N7752 --> N7755
  N7756[error()]:::mth
  N7752 --> N7756
  N7757[log()]:::mth
  N7752 --> N7757
  N7758[File: classes.ts]:::file
  N7741 --> N7758
  N7759[Class: Bases]:::cls
  N7758 --> N7759
  N7760[InheritMultiple()]:::mth
  N7759 --> N7760
  N7761[File: dedupe.ts]:::file
  N7741 --> N7761
  N7762[Class: Deduplicator]:::cls
  N7761 --> N7762
  N7763[function()]:::mth
  N7762 --> N7763
  N7764[trackRun()]:::mth
  N7762 --> N7764
  N7765[isDuplicate()]:::mth
  N7762 --> N7765
  N7766[reset()]:::mth
  N7762 --> N7766
  N7767[startCooldown()]:::mth
  N7762 --> N7767
  N7768[File: error.ts]:::file
  N7741 --> N7768
  N7769[Class: AIbitatError]:::cls
  N7768 --> N7769
  N7770[Class: APIError]:::cls
  N7768 --> N7770
  N7771[Class: RetryError]:::cls
  N7768 --> N7771
  N7773[File: eventBus.ts]:::file
  N7741 --> N7773
  N7774[Class: EventBus]:::cls
  N7773 --> N7774
  N7775[getInstance()]:::mth
  N7774 --> N7775
  N7776[emit()]:::mth
  N7774 --> N7776
  N7777[on()]:::mth
  N7774 --> N7777
  N7778[off()]:::mth
  N7774 --> N7778
  N7779[once()]:::mth
  N7774 --> N7779
  N7781[File: browserMonitor.ts]:::file
  N7741 --> N7781
  N7782[Class: BrowserMonitor]:::cls
  N7781 --> N7782
  N7783[getInstance()]:::mth
  N7782 --> N7783
  N7784[initializeMonitoring()]:::mth
  N7782 --> N7784
  N7785[collectMetrics()]:::mth
  N7782 --> N7785
  N7786[getFirstContentfulPaint()]:::mth
  N7782 --> N7786
  N7787[stopMonitoring()]:::mth
  N7782 --> N7787
  N7795[File: validator.ts]:::file
  N7741 --> N7795
  N7796[Class: WorkflowValidator]:::cls
  N7795 --> N7796
  N7797[validateWorkflow()]:::mth
  N7796 --> N7797
  N7798[validateNode()]:::mth
  N7796 --> N7798
  N7799[validateEdge()]:::mth
  N7796 --> N7799
  N7800[validateWorkflowStructure()]:::mth
  N7796 --> N7800
  N7801[hasCycles()]:::mth
  N7796 --> N7801
  N7802[Class: Validator]:::cls
  N7795 --> N7802
  N7803[validateWorkflow()]:::mth
  N7802 --> N7803
  N7804[validateNode()]:::mth
  N7802 --> N7804
  N7805[validateEdge()]:::mth
  N7802 --> N7805
  N7806[validateWorkflowStructure()]:::mth
  N7802 --> N7806
  N7807[hasCycles()]:::mth
  N7802 --> N7807
  N7813[File: cn.ts]:::file
  N7741 --> N7813
  N7814[Class: names]:::cls
  N7813 --> N7814
  N7815[cn()]:::mth
  N7814 --> N7815
  N7816[Class: merging]:::cls
  N7813 --> N7816
  N7817[cn()]:::mth
  N7816 --> N7817
  N7821[File: error.ts]:::file
  N7741 --> N7821
  N7822[Class: AIError]:::cls
  N7821 --> N7822
  N7825[File: index.ts]:::file
  N7741 --> N7825
  N7826[Class: LoggerWrapper]:::cls
  N7825 --> N7826
  N7827[createCustomLogger()]:::mth
  N7826 --> N7827
  N7828[error()]:::mth
  N7826 --> N7828
  N7829[warn()]:::mth
  N7826 --> N7829
  N7830[info()]:::mth
  N7826 --> N7830
  N7831[http()]:::mth
  N7826 --> N7831
  N7832[File: performance.ts]:::file
  N7741 --> N7832
  N7833[Class: PerformanceMonitor]:::cls
  N7832 --> N7833
  N7834[mark()]:::mth
  N7833 --> N7834
  N7835[measure()]:::mth
  N7833 --> N7835
  N7836[start()]:::mth
  N7833 --> N7836
  N7837[stop()]:::mth
  N7833 --> N7837
  N7838[getDuration()]:::mth
  N7833 --> N7838
  N7843[web-scraping]:::pkg
  TNF --> N7843
  N7844[File: WebScrapingService.ts]:::file
  N7843 --> N7844
  N7845[Class: BaseErrorHandler]:::cls
  N7844 --> N7845
  N7846[handleError()]:::mth
  N7845 --> N7846
  N7847[recordMetric()]:::mth
  N7845 --> N7847
  N7848[getMetrics()]:::mth
  N7845 --> N7848
  N7849[scrapeSimple()]:::mth
  N7845 --> N7849
  N7850[scrapeCrawl4AI()]:::mth
  N7845 --> N7850
  N7851[Class: BaseMonitoringSystem]:::cls
  N7844 --> N7851
  N7852[handleError()]:::mth
  N7851 --> N7852
  N7853[recordMetric()]:::mth
  N7851 --> N7853
  N7854[getMetrics()]:::mth
  N7851 --> N7854
  N7855[scrapeSimple()]:::mth
  N7851 --> N7855
  N7856[scrapeCrawl4AI()]:::mth
  N7851 --> N7856
  N7857[Class: WebScrapingService]:::cls
  N7844 --> N7857
  N7858[handleError()]:::mth
  N7857 --> N7858
  N7859[recordMetric()]:::mth
  N7857 --> N7859
  N7860[getMetrics()]:::mth
  N7857 --> N7860
  N7861[scrapeSimple()]:::mth
  N7857 --> N7861
  N7862[scrapeCrawl4AI()]:::mth
  N7857 --> N7862
  N7863[File: ElectronWebScrapingBridge.ts]:::file
  N7843 --> N7863
  N7864[Class: ElectronWebScrapingBridge]:::cls
  N7863 --> N7864
  N7865[setupIpcHandlers()]:::mth
  N7864 --> N7865
  N7866[initialize()]:::mth
  N7864 --> N7866
  N7867[cleanup()]:::mth
  N7864 --> N7867
  N7868[getStatistics()]:::mth
  N7864 --> N7868
  N7870[File: WebScrapingMCPTools.ts]:::file
  N7843 --> N7870
  N7871[Class: WebScrapingMCPTools]:::cls
  N7870 --> N7871
  N7872[getTools()]:::mth
  N7871 --> N7872
  N7873[getCrawl4AIScrapeTool()]:::mth
  N7871 --> N7873
  N7874[async()]:::mth
  N7871 --> N7874
  N7875[getSimpleScrapeTool()]:::mth
  N7871 --> N7875
  N7876[async()]:::mth
  N7871 --> N7876
  N7877[File: ProxyService.ts]:::file
  N7843 --> N7877
  N7878[Class: BaseErrorHandler]:::cls
  N7877 --> N7878
  N7879[handleError()]:::mth
  N7878 --> N7879
  N7880[recordMetric()]:::mth
  N7878 --> N7880
  N7881[getMetrics()]:::mth
  N7878 --> N7881
  N7882[proxyRequest()]:::mth
  N7878 --> N7882
  N7883[validateProxyRequest()]:::mth
  N7878 --> N7883
  N7884[Class: BaseMonitoringSystem]:::cls
  N7877 --> N7884
  N7885[handleError()]:::mth
  N7884 --> N7885
  N7886[recordMetric()]:::mth
  N7884 --> N7886
  N7887[getMetrics()]:::mth
  N7884 --> N7887
  N7888[proxyRequest()]:::mth
  N7884 --> N7888
  N7889[validateProxyRequest()]:::mth
  N7884 --> N7889
  N7890[Class: ProxyService]:::cls
  N7877 --> N7890
  N7891[handleError()]:::mth
  N7890 --> N7891
  N7892[recordMetric()]:::mth
  N7890 --> N7892
  N7893[getMetrics()]:::mth
  N7890 --> N7893
  N7894[proxyRequest()]:::mth
  N7890 --> N7894
  N7895[validateProxyRequest()]:::mth
  N7890 --> N7895
  N7896[File: WebScrapingSSEController.ts]:::file
  N7843 --> N7896
  N7897[Class: WebScrapingSSEController]:::cls
  N7896 --> N7897
  N7898[processBatchScraping()]:::mth
  N7897 --> N7898
  N7899[executeSingleScraping()]:::mth
  N7897 --> N7899
  N7901[File: WebScrapingWebSocketGateway.ts]:::file
  N7843 --> N7901
  N7902[Class: WebScrapingWebSocketGateway]:::cls
  N7901 --> N7902
  N7903[getActiveSessionsCount()]:::mth
  N7902 --> N7903
  N7904[getSessionStatistics()]:::mth
  N7902 --> N7904
  N7905[websocket]:::pkg
  TNF --> N7905
  N7906[File: optimized-websocket.service.ts]:::file
  N7905 --> N7906
  N7907[Class: OptimizedWebSocketService]:::cls
  N7906 --> N7907
  N7908[onModuleInit()]:::mth
  N7907 --> N7908
  N7909[handleConnection()]:::mth
  N7907 --> N7909
  N7910[handleDisconnect()]:::mth
  N7907 --> N7910
  N7911[authenticateConnection()]:::mth
  N7907 --> N7911
  N7912[addToConnectionPool()]:::mth
  N7907 --> N7912
  N7913[websocket-infrastructure]:::pkg
  TNF --> N7913
  N7915[File: load-balancer.ts]:::file
  N7913 --> N7915
  N7916[Class: WebSocketLoadBalancer]:::cls
  N7915 --> N7916
  N7917[getServerForUser()]:::mth
  N7916 --> N7917
  N7918[assignUserToServer()]:::mth
  N7916 --> N7918
  N7919[removeUserFromServer()]:::mth
  N7916 --> N7919
  N7920[markServerHealthy()]:::mth
  N7916 --> N7920
  N7921[markServerUnhealthy()]:::mth
  N7916 --> N7921
  N7922[File: redis-adapter.ts]:::file
  N7913 --> N7922
  N7923[Class: RedisWebSocketAdapter]:::cls
  N7922 --> N7923
  N7924[initialize()]:::mth
  N7923 --> N7924
  N7925[waitForConnection()]:::mth
  N7923 --> N7925
  N7926[setupSocketIO()]:::mth
  N7923 --> N7926
  N7927[broadcast()]:::mth
  N7923 --> N7927
  N7928[sendToUser()]:::mth
  N7923 --> N7928
  N7929[File: connection-manager.ts]:::file
  N7913 --> N7929
  N7930[Class: ConnectionManager]:::cls
  N7929 --> N7930
  N7931[handleConnection()]:::mth
  N7930 --> N7931
  N7932[handleDisconnection()]:::mth
  N7930 --> N7932
  N7933[setupHeartbeat()]:::mth
  N7930 --> N7933
  N7934[setupEventHandlers()]:::mth
  N7930 --> N7934
  N7935[broadcast()]:::mth
  N7930 --> N7935
  N7936[File: connection-pool.ts]:::file
  N7913 --> N7936
  N7937[Class: ConnectionPool]:::cls
  N7936 --> N7937
  N7938[add()]:::mth
  N7937 --> N7938
  N7939[remove()]:::mth
  N7937 --> N7939
  N7940[get()]:::mth
  N7937 --> N7940
  N7941[getUserConnections()]:::mth
  N7937 --> N7941
  N7942[getMetadata()]:::mth
  N7937 --> N7942
  N7946[File: websocket-metrics.ts]:::file
  N7913 --> N7946
  N7947[Class: WebSocketMonitoring]:::cls
  N7946 --> N7947
  N7948[initializeMetrics()]:::mth
  N7947 --> N7948
  N7949[recordConnection()]:::mth
  N7947 --> N7949
  N7950[recordDisconnection()]:::mth
  N7947 --> N7950
  N7951[recordMessage()]:::mth
  N7947 --> N7951
  N7952[recordMessageLatency()]:::mth
  N7947 --> N7952
  N7954[File: message-queue.ts]:::file
  N7913 --> N7954
  N7955[Class: MessageQueue]:::cls
  N7954 --> N7955
  N7956[start()]:::mth
  N7955 --> N7956
  N7957[stop()]:::mth
  N7955 --> N7957
  N7958[enqueue()]:::mth
  N7955 --> N7958
  N7959[dequeue()]:::mth
  N7955 --> N7959
  N7960[get()]:::mth
  N7955 --> N7960
  N7962[File: reconnection-strategy.ts]:::file
  N7913 --> N7962
  N7963[Class: ExponentialBackoffStrategy]:::cls
  N7962 --> N7963
  N7964[calculateDelay()]:::mth
  N7963 --> N7964
  N7965[shouldRetry()]:::mth
  N7963 --> N7965
  N7966[calculateDelay()]:::mth
  N7963 --> N7966
  N7967[shouldRetry()]:::mth
  N7963 --> N7967
  N7968[fibonacci()]:::mth
  N7963 --> N7968
  N7969[Class: LinearBackoffStrategy]:::cls
  N7962 --> N7969
  N7970[calculateDelay()]:::mth
  N7969 --> N7970
  N7971[shouldRetry()]:::mth
  N7969 --> N7971
  N7972[calculateDelay()]:::mth
  N7969 --> N7972
  N7973[shouldRetry()]:::mth
  N7969 --> N7973
  N7974[fibonacci()]:::mth
  N7969 --> N7974
  N7975[Class: FibonacciBackoffStrategy]:::cls
  N7962 --> N7975
  N7976[calculateDelay()]:::mth
  N7975 --> N7976
  N7977[shouldRetry()]:::mth
  N7975 --> N7977
  N7978[calculateDelay()]:::mth
  N7975 --> N7978
  N7979[shouldRetry()]:::mth
  N7975 --> N7979
  N7980[fibonacci()]:::mth
  N7975 --> N7980
  N7981[Class: ReconnectionManager]:::cls
  N7962 --> N7981
  N7982[calculateDelay()]:::mth
  N7981 --> N7982
  N7983[shouldRetry()]:::mth
  N7981 --> N7983
  N7984[calculateDelay()]:::mth
  N7981 --> N7984
  N7985[shouldRetry()]:::mth
  N7981 --> N7985
  N7986[fibonacci()]:::mth
  N7981 --> N7986
  N7988[File: load-tester.ts]:::file
  N7913 --> N7988
  N7989[Class: WebSocketLoadTester]:::cls
  N7988 --> N7989
  N7990[run()]:::mth
  N7989 --> N7990
  N7991[createClients()]:::mth
  N7989 --> N7991
  N7992[setupClientHandlers()]:::mth
  N7989 --> N7992
  N7993[sendMessages()]:::mth
  N7989 --> N7993
  N7994[generateMessage()]:::mth
  N7989 --> N7994
  N7995[File: websocket-client.ts]:::file
  N7913 --> N7995
  N7996[Class: WebSocketTestClient]:::cls
  N7995 --> N7996
  N7997[connect()]:::mth
  N7996 --> N7997
  N7998[disconnect()]:::mth
  N7996 --> N7998
  N7999[send()]:::mth
  N7996 --> N7999
  N8000[joinRoom()]:::mth
  N7996 --> N8000
  N8001[leaveRoom()]:::mth
  N7996 --> N8001
  N8003[File: binary-protocol.ts]:::file
  N7913 --> N8003
  N8004[Class: BinaryProtocol]:::cls
  N8003 --> N8004
  N8005[encode()]:::mth
  N8004 --> N8005
  N8006[decode()]:::mth
  N8004 --> N8006
  N8007[isBinary()]:::mth
  N8004 --> N8007
  N8008[toBuffer()]:::mth
  N8004 --> N8008
  N8009[getSize()]:::mth
  N8004 --> N8009
  N8010[Class: MessageSerializer]:::cls
  N8003 --> N8010
  N8011[encode()]:::mth
  N8010 --> N8011
  N8012[decode()]:::mth
  N8010 --> N8012
  N8013[isBinary()]:::mth
  N8010 --> N8013
  N8014[toBuffer()]:::mth
  N8010 --> N8014
  N8015[getSize()]:::mth
  N8010 --> N8015
  N8016[Class: ProtocolNegotiator]:::cls
  N8003 --> N8016
  N8017[encode()]:::mth
  N8016 --> N8017
  N8018[decode()]:::mth
  N8016 --> N8018
  N8019[isBinary()]:::mth
  N8016 --> N8019
  N8020[toBuffer()]:::mth
  N8016 --> N8020
  N8021[getSize()]:::mth
  N8016 --> N8021
  N8023[File: compression.ts]:::file
  N7913 --> N8023
  N8024[Class: CompressionUtil]:::cls
  N8023 --> N8024
  N8025[compress()]:::mth
  N8024 --> N8025
  N8026[decompress()]:::mth
  N8024 --> N8026
  N8027[shouldCompress()]:::mth
  N8024 --> N8027
  N8028[getDataSize()]:::mth
  N8024 --> N8028
  N8029[getCompressionRatio()]:::mth
  N8024 --> N8029
  N8030[Class: CompressionMiddleware]:::cls
  N8023 --> N8030
  N8031[compress()]:::mth
  N8030 --> N8031
  N8032[decompress()]:::mth
  N8030 --> N8032
  N8033[shouldCompress()]:::mth
  N8030 --> N8033
  N8034[getDataSize()]:::mth
  N8030 --> N8034
  N8035[getCompressionRatio()]:::mth
  N8030 --> N8035
  N8037[File: websocket.gateway.ts]:::file
  N7913 --> N8037
  N8038[Class: WebSocketGateway]:::cls
  N8037 --> N8038
  N8039[afterInit()]:::mth
  N8038 --> N8039
  N8040[handleConnection()]:::mth
  N8038 --> N8040
  N8041[handleDisconnect()]:::mth
  N8038 --> N8041
  N8042[broadcast()]:::mth
  N8038 --> N8042
  N8043[sendToUser()]:::mth
  N8038 --> N8043
  N8044[File: websocket.module.ts]:::file
  N7913 --> N8044
  N8045[Class: WebSocketInfrastructureModule]:::cls
  N8044 --> N8045
  N8046[forRoot()]:::mth
  N8045 --> N8046
  N8047[workflow-engine]:::pkg
  TNF --> N8047
  N8049[File: WorkflowBuilder.ts]:::file
  N8047 --> N8049
  N8050[Class: WorkflowBuilder]:::cls
  N8049 --> N8050
  N8051[createWorkflow()]:::mth
  N8050 --> N8051
  N8052[loadWorkflow()]:::mth
  N8050 --> N8052
  N8053[addNode()]:::mth
  N8050 --> N8053
  N8054[removeNode()]:::mth
  N8050 --> N8054
  N8055[updateNode()]:::mth
  N8050 --> N8055
  N8056[File: WorkflowEngine.ts]:::file
  N8047 --> N8056
  N8057[Class: UnifiedWorkflowEngine]:::cls
  N8056 --> N8057
  N8058[registerAgent()]:::mth
  N8057 --> N8058
  N8059[serializeContext()]:::mth
  N8057 --> N8059
  N8060[deserializeContext()]:::mth
  N8057 --> N8060
  N8061[recoverInterruptedExecutions()]:::mth
  N8057 --> N8061
  N8062[executeWorkflow()]:::mth
  N8057 --> N8062
  N8063[File: WorkflowExecutor.ts]:::file
  N8047 --> N8063
  N8064[Class: WorkflowExecutor]:::cls
  N8063 --> N8064
  N8065[executeStep()]:::mth
  N8064 --> N8065
  N8066[executeNodeByType()]:::mth
  N8064 --> N8066
  N8067[executeStartNode()]:::mth
  N8064 --> N8067
  N8068[executeEndNode()]:::mth
  N8064 --> N8068
  N8069[executeAgentTaskNode()]:::mth
  N8064 --> N8069
  N8070[File: index.ts]:::file
  N8047 --> N8070
  N8071[Class: WorkflowEngineFactory]:::cls
  N8070 --> N8071
  N8072[create()]:::mth
  N8071 --> N8072
  N8073[createDefault()]:::mth
  N8071 --> N8073
  N8074[createWorkflow()]:::mth
  N8071 --> N8074
  N8075[executeWorkflow()]:::mth
  N8071 --> N8075
  N8076[getHealthStatus()]:::mth
  N8071 --> N8076
  N8077[Class: WorkflowEngineManager]:::cls
  N8070 --> N8077
  N8078[create()]:::mth
  N8077 --> N8078
  N8079[createDefault()]:::mth
  N8077 --> N8079
  N8080[createWorkflow()]:::mth
  N8077 --> N8080
  N8081[executeWorkflow()]:::mth
  N8077 --> N8081
  N8082[getHealthStatus()]:::mth
  N8077 --> N8082
  N8083[File: system-queue.service.ts]:::file
  N8047 --> N8083
  N8084[Class: SystemQueueService]:::cls
  N8083 --> N8084
  N8085[initializeQueues()]:::mth
  N8084 --> N8085
  N8086[dispatchTask()]:::mth
  N8084 --> N8086
  N8087[scheduleAgentExecution()]:::mth
  N8084 --> N8087
  N8088[close()]:::mth
  N8084 --> N8088
  N8089[parse()]:::mth
  N8084 --> N8089
  N8091[File: tnf-router.ts]:::file
  N8047 --> N8091
  N8092[Class: TNFRouter]:::cls
  N8091 --> N8092
  N8093[start()]:::mth
  N8092 --> N8093
  N8094[stop()]:::mth
  N8092 --> N8094
  N8095[handleIngressMessage()]:::mth
  N8092 --> N8095
  N8096[routeTask()]:::mth
  N8092 --> N8096
  N8097[routeToInbox()]:::mth
  N8092 --> N8097
  N8098[File: WorkflowQueue.ts]:::file
  N8047 --> N8098
  N8099[Class: WorkflowQueue]:::cls
  N8098 --> N8099
  N8100[addStartWorkflowJob()]:::mth
  N8099 --> N8100
  N8101[addExecuteNodeJob()]:::mth
  N8099 --> N8101
  N8102[addFinalizeWorkflowJob()]:::mth
  N8099 --> N8102
  N8103[close()]:::mth
  N8099 --> N8103
  N8104[getQueue()]:::mth
  N8099 --> N8104
  N8105[File: WorkflowWorker.ts]:::file
  N8047 --> N8105
  N8106[Class: WorkflowWorker]:::cls
  N8105 --> N8106
  N8107[processJob()]:::mth
  N8106 --> N8107
  N8108[processStartWorkflow()]:::mth
  N8106 --> N8108
  N8109[processExecuteNode()]:::mth
  N8106 --> N8109
  N8110[close()]:::mth
  N8106 --> N8110
  N8111[File: WorkflowRepository.ts]:::file
  N8047 --> N8111
  N8112[Class: WorkflowRepository]:::cls
  N8111 --> N8112
  N8113[createWorkflow()]:::mth
  N8112 --> N8113
  N8114[getWorkflow()]:::mth
  N8112 --> N8114
  N8115[updateWorkflow()]:::mth
  N8112 --> N8115
  N8116[deleteWorkflow()]:::mth
  N8112 --> N8116
  N8117[queryWorkflows()]:::mth
  N8112 --> N8117
  N8119[File: TelemetryService.ts]:::file
  N8047 --> N8119
  N8120[Class: TelemetryService]:::cls
  N8119 --> N8120
  N8121[getTracer()]:::mth
  N8120 --> N8121
  N8122[extractContext()]:::mth
  N8120 --> N8122
  N8123[injectContext()]:::mth
  N8120 --> N8123
  N8124[emitTaskExecutionLog()]:::mth
  N8120 --> N8124
  N8125[emitAndPersistTaskExecutionLog()]:::mth
  N8120 --> N8125
  N8126[File: CloudflareWorkflowTranspiler.ts]:::file
  N8047 --> N8126
  N8127[Class: CloudflareWorkflowTranspiler]:::cls
  N8126 --> N8127
  N8128[transpile()]:::mth
  N8127 --> N8128
  N8129[run()]:::mth
  N8127 --> N8129
  N8130[generateNodeChain()]:::mth
  N8127 --> N8130
  N8131[transpileNode()]:::mth
  N8127 --> N8131
  N8132[findNode()]:::mth
  N8127 --> N8132
  N8135[File: WorkflowValidator.ts]:::file
  N8047 --> N8135
  N8136[Class: WorkflowValidator]:::cls
  N8135 --> N8136
  N8137[validateWorkflow()]:::mth
  N8136 --> N8137
  N8138[validateWorkflowDefinition()]:::mth
  N8136 --> N8138
  N8139[validateNode()]:::mth
  N8136 --> N8139
  N8140[validateNodeConfiguration()]:::mth
  N8136 --> N8140
  N8141[validateAgentTaskNode()]:::mth
  N8136 --> N8141
  N8142[adk-gateway]:::pkg
  TNF --> N8142
  N8143[ai-arcade]:::pkg
  TNF --> N8143
  N8149[File: ArcadeService.ts]:::file
  N8143 --> N8149
  N8150[Class: ArcadeService]:::cls
  N8149 --> N8150
  N8151[sanitizeText()]:::mth
  N8150 --> N8151
  N8152[getFeaturedAgents()]:::mth
  N8150 --> N8152
  N8153[getAgentById()]:::mth
  N8150 --> N8153
  N8154[searchAgents()]:::mth
  N8150 --> N8154
  N8155[fetchCatalogCandidates()]:::mth
  N8150 --> N8155
  N8156[File: AuthService.ts]:::file
  N8143 --> N8156
  N8157[Class: AuthService]:::cls
  N8156 --> N8157
  N8158[getStorage()]:::mth
  N8157 --> N8158
  N8159[login()]:::mth
  N8157 --> N8159
  N8160[register()]:::mth
  N8157 --> N8160
  N8161[logout()]:::mth
  N8157 --> N8161
  N8162[getCurrentUser()]:::mth
  N8157 --> N8162
  N8164[File: TokenService.ts]:::file
  N8143 --> N8164
  N8165[Class: TokenService]:::cls
  N8164 --> N8165
  N8166[getTokenPackages()]:::mth
  N8165 --> N8166
  N8167[purchaseTokens()]:::mth
  N8165 --> N8167
  N8168[getTransactionHistory()]:::mth
  N8165 --> N8168
  N8169[useTokens()]:::mth
  N8165 --> N8169
  N8170[calculateRunCost()]:::mth
  N8165 --> N8170
  N8171[File: WebSocketService.ts]:::file
  N8143 --> N8171
  N8172[Class: WebSocketService]:::cls
  N8171 --> N8172
  N8173[connect()]:::mth
  N8172 --> N8173
  N8174[getWebSocketUrl()]:::mth
  N8172 --> N8174
  N8175[disconnect()]:::mth
  N8172 --> N8175
  N8176[subscribe()]:::mth
  N8172 --> N8176
  N8177[send()]:::mth
  N8172 --> N8177
  N8180[api]:::pkg
  TNF --> N8180
  N8181[File: agent.factory.ts]:::file
  N8180 --> N8181
  N8182[Class: AgentFactory]:::cls
  N8181 --> N8182
  N8183[createAgent()]:::mth
  N8182 --> N8183
  N8184[updateAgent()]:::mth
  N8182 --> N8184
  N8185[destroyAgent()]:::mth
  N8182 --> N8185
  N8186[getDefaultConfig()]:::mth
  N8182 --> N8186
  N8187[getActiveAgents()]:::mth
  N8182 --> N8187
  N8188[File: agents.module.ts]:::file
  N8180 --> N8188
  N8189[Class: AgentsModule]:::cls
  N8188 --> N8189
  N8190[File: agents.service.ts]:::file
  N8180 --> N8190
  N8191[Class: AgentsService]:::cls
  N8190 --> N8191
  N8192[create()]:::mth
  N8191 --> N8192
  N8193[findAll()]:::mth
  N8191 --> N8193
  N8194[update()]:::mth
  N8191 --> N8194
  N8195[File: analyzer.service.ts]:::file
  N8180 --> N8195
  N8196[Class: AnalyzerAgentService]:::cls
  N8195 --> N8196
  N8197[scanCodebase()]:::mth
  N8196 --> N8197
  N8198[analyzeFile()]:::mth
  N8196 --> N8198
  N8199[identifyBottlenecks()]:::mth
  N8196 --> N8199
  N8200[findAntiPatterns()]:::mth
  N8196 --> N8200
  N8201[calculateMetrics()]:::mth
  N8196 --> N8201
  N8202[File: architect.service.ts]:::file
  N8180 --> N8202
  N8203[Class: ArchitectAgentService]:::cls
  N8202 --> N8203
  N8204[reviewArchitecture()]:::mth
  N8203 --> N8204
  N8205[createImplementationPlan()]:::mth
  N8203 --> N8205
  N8206[suggestNewCapabilities()]:::mth
  N8203 --> N8206
  N8207[storeReview()]:::mth
  N8203 --> N8207
  N8208[File: brand-consistency-agent.module.ts]:::file
  N8180 --> N8208
  N8209[Class: BrandConsistencyAgentModule]:::cls
  N8208 --> N8209
  N8210[File: brand-consistency-agent.service.ts]:::file
  N8180 --> N8210
  N8211[Class: BrandConsistencyAgentService]:::cls
  N8210 --> N8211
  N8212[onModuleInit()]:::mth
  N8211 --> N8212
  N8213[initializePromptTemplate()]:::mth
  N8211 --> N8213
  N8214[isMissingPromptTemplateSchema()]:::mth
  N8211 --> N8214
  N8215[getAgentInfo()]:::mth
  N8211 --> N8215
  N8216[analyzeComponent()]:::mth
  N8211 --> N8216
  N8217[File: brand-consistency.controller.ts]:::file
  N8180 --> N8217
  N8218[Class: BrandConsistencyController]:::cls
  N8217 --> N8218
  N8219[getAgentInfo()]:::mth
  N8218 --> N8219
  N8220[getAnalysisSummary()]:::mth
  N8218 --> N8220
  N8221[getBrandCSS()]:::mth
  N8218 --> N8221
  N8222[runDemo()]:::mth
  N8218 --> N8222
  N8223[File: browser-hub-swarm.controller.ts]:::file
  N8180 --> N8223
  N8224[Class: BrowserHubSwarmController]:::cls
  N8223 --> N8224
  N8225[getStatus()]:::mth
  N8224 --> N8225
  N8226[runIteration()]:::mth
  N8224 --> N8226
  N8227[runUntilComplete()]:::mth
  N8224 --> N8227
  N8228[getAllIssues()]:::mth
  N8224 --> N8228
  N8229[getAllSuggestions()]:::mth
  N8224 --> N8229
  N8230[File: browser-hub-swarm.module.ts]:::file
  N8180 --> N8230
  N8231[Class: BrowserHubSwarmModule]:::cls
  N8230 --> N8231
  N8232[File: browser-hub-swarm.service.ts]:::file
  N8180 --> N8232
  N8233[Class: in]:::cls
  N8232 --> N8233
  N8234[analyze()]:::mth
  N8233 --> N8234
  N8235[analyze()]:::mth
  N8233 --> N8235
  N8236[checkToolbarIssues()]:::mth
  N8233 --> N8236
  N8237[checkButtonIssues()]:::mth
  N8233 --> N8237
  N8238[checkLayoutIssues()]:::mth
  N8233 --> N8238
  N8239[Class: BrowserHubAgent]:::cls
  N8232 --> N8239
  N8240[analyze()]:::mth
  N8239 --> N8240
  N8241[analyze()]:::mth
  N8239 --> N8241
  N8242[checkToolbarIssues()]:::mth
  N8239 --> N8242
  N8243[checkButtonIssues()]:::mth
  N8239 --> N8243
  N8244[checkLayoutIssues()]:::mth
  N8239 --> N8244
  N8245[Class: UIUXAgent]:::cls
  N8232 --> N8245
  N8246[analyze()]:::mth
  N8245 --> N8246
  N8247[analyze()]:::mth
  N8245 --> N8247
  N8248[checkToolbarIssues()]:::mth
  N8245 --> N8248
  N8249[checkButtonIssues()]:::mth
  N8245 --> N8249
  N8250[checkLayoutIssues()]:::mth
  N8245 --> N8250
  N8251[Class: ExtensionAgent]:::cls
  N8232 --> N8251
  N8252[analyze()]:::mth
  N8251 --> N8252
  N8253[analyze()]:::mth
  N8251 --> N8253
  N8254[checkToolbarIssues()]:::mth
  N8251 --> N8254
  N8255[checkButtonIssues()]:::mth
  N8251 --> N8255
  N8256[checkLayoutIssues()]:::mth
  N8251 --> N8256
  N8257[Class: to]:::cls
  N8232 --> N8257
  N8258[analyze()]:::mth
  N8257 --> N8258
  N8259[analyze()]:::mth
  N8257 --> N8259
  N8260[checkToolbarIssues()]:::mth
  N8257 --> N8260
  N8261[checkButtonIssues()]:::mth
  N8257 --> N8261
  N8262[checkLayoutIssues()]:::mth
  N8257 --> N8262
  N8263[Class: IntegrationAgent]:::cls
  N8232 --> N8263
  N8264[analyze()]:::mth
  N8263 --> N8264
  N8265[analyze()]:::mth
  N8263 --> N8265
  N8266[checkToolbarIssues()]:::mth
  N8263 --> N8266
  N8267[checkButtonIssues()]:::mth
  N8263 --> N8267
  N8268[checkLayoutIssues()]:::mth
  N8263 --> N8268
  N8269[Class: CodeQualityAgent]:::cls
  N8232 --> N8269
  N8270[analyze()]:::mth
  N8269 --> N8270
  N8271[analyze()]:::mth
  N8269 --> N8271
  N8272[checkToolbarIssues()]:::mth
  N8269 --> N8272
  N8273[checkButtonIssues()]:::mth
  N8269 --> N8273
  N8274[checkLayoutIssues()]:::mth
  N8269 --> N8274
  N8275[Class: BrowserHubSwarmService]:::cls
  N8232 --> N8275
  N8276[analyze()]:::mth
  N8275 --> N8276
  N8277[analyze()]:::mth
  N8275 --> N8277
  N8278[checkToolbarIssues()]:::mth
  N8275 --> N8278
  N8279[checkButtonIssues()]:::mth
  N8275 --> N8279
  N8280[checkLayoutIssues()]:::mth
  N8275 --> N8280
  N8281[Class: threshold]:::cls
  N8232 --> N8281
  N8282[analyze()]:::mth
  N8281 --> N8282
  N8283[analyze()]:::mth
  N8281 --> N8283
  N8284[checkToolbarIssues()]:::mth
  N8281 --> N8284
  N8285[checkButtonIssues()]:::mth
  N8281 --> N8285
  N8286[checkLayoutIssues()]:::mth
  N8281 --> N8286
  N8287[Class: status]:::cls
  N8232 --> N8287
  N8288[analyze()]:::mth
  N8287 --> N8288
  N8289[analyze()]:::mth
  N8287 --> N8289
  N8290[checkToolbarIssues()]:::mth
  N8287 --> N8290
  N8291[checkButtonIssues()]:::mth
  N8287 --> N8291
  N8292[checkLayoutIssues()]:::mth
  N8287 --> N8292
  N8294[File: coordinator.service.ts]:::file
  N8180 --> N8294
  N8295[Class: CoordinatorAgentService]:::cls
  N8294 --> N8295
  N8296[startSelfImprovementCycle()]:::mth
  N8295 --> N8296
  N8297[runAnalysisPhase()]:::mth
  N8295 --> N8297
  N8298[runArchitecturePhase()]:::mth
  N8295 --> N8298
  N8299[runImplementationPhase()]:::mth
  N8295 --> N8299
  N8300[runReviewPhase()]:::mth
  N8295 --> N8300
  N8301[File: agent.dto.ts]:::file
  N8180 --> N8301
  N8302[Class: AgentProfileDto]:::cls
  N8301 --> N8302
  N8303[Class: CreateAgentDto]:::cls
  N8301 --> N8303
  N8304[Class: UpdateAgentDto]:::cls
  N8301 --> N8304
  N8305[Class: AgentResponseDto]:::cls
  N8301 --> N8305
  N8306[File: implementer.service.ts]:::file
  N8180 --> N8306
  N8307[Class: ImplementerAgentService]:::cls
  N8306 --> N8307
  N8308[implementImprovement()]:::mth
  N8307 --> N8308
  N8309[implementQuickFix()]:::mth
  N8307 --> N8309
  N8310[generateFixForIssue()]:::mth
  N8307 --> N8310
  N8311[createFeature()]:::mth
  N8307 --> N8311
  N8312[scaffoldFeature()]:::mth
  N8307 --> N8312
  N8313[File: reviewer.service.ts]:::file
  N8180 --> N8313
  N8314[Class: ReviewerAgentService]:::cls
  N8313 --> N8314
  N8315[reviewImplementation()]:::mth
  N8314 --> N8315
  N8316[reviewFile()]:::mth
  N8314 --> N8316
  N8317[extractFunctionBody()]:::mth
  N8314 --> N8317
  N8318[checkTestCoverage()]:::mth
  N8314 --> N8318
  N8319[calculateQualityMetrics()]:::mth
  N8314 --> N8319
  N8320[File: app.controller.ts]:::file
  N8180 --> N8320
  N8321[Class: AppController]:::cls
  N8320 --> N8321
  N8322[getStatus()]:::mth
  N8321 --> N8322
  N8323[getHealth()]:::mth
  N8321 --> N8323
  N8324[redirectLegacyHub()]:::mth
  N8321 --> N8324
  N8325[redirectLegacyAuditLogs()]:::mth
  N8321 --> N8325
  N8326[File: app.module.ts]:::file
  N8180 --> N8326
  N8327[Class: AppModule]:::cls
  N8326 --> N8327
  N8328[guards()]:::mth
  N8327 --> N8328
  N8329[configure()]:::mth
  N8327 --> N8329
  N8330[File: app.service.ts]:::file
  N8180 --> N8330
  N8331[Class: AppService]:::cls
  N8330 --> N8331
  N8332[getHello()]:::mth
  N8331 --> N8332
  N8333[getVersion()]:::mth
  N8331 --> N8333
  N8334[getEnvironment()]:::mth
  N8331 --> N8334
  N8338[File: refresh-token.dto.ts]:::file
  N8180 --> N8338
  N8339[Class: RefreshTokenDto]:::cls
  N8338 --> N8339
  N8340[File: jwt-auth.guard.ts]:::file
  N8180 --> N8340
  N8341[Class: JwtAuthGuard]:::cls
  N8340 --> N8341
  N8342[canActivate()]:::mth
  N8341 --> N8342
  N8343[extractTokenFromHeader()]:::mth
  N8341 --> N8343
  N8344[File: ws-auth.guard.ts]:::file
  N8180 --> N8344
  N8345[Class: WsAuthGuard]:::cls
  N8344 --> N8345
  N8346[canActivate()]:::mth
  N8345 --> N8346
  N8348[File: cache.service.ts]:::file
  N8180 --> N8348
  N8349[Class: CacheService]:::cls
  N8348 --> N8349
  N8350[parseInt()]:::mth
  N8349 --> N8350
  N8351[parseInt()]:::mth
  N8349 --> N8351
  N8352[get()]:::mth
  N8349 --> N8352
  N8353[set()]:::mth
  N8349 --> N8353
  N8354[del()]:::mth
  N8349 --> N8354
  N8355[File: gcp.config.ts]:::file
  N8180 --> N8355
  N8356[Class: GcpConfigService]:::cls
  N8355 --> N8356
  N8357[getProjectId()]:::mth
  N8356 --> N8357
  N8358[getGcsBucket()]:::mth
  N8356 --> N8358
  N8359[getGcpConfig()]:::mth
  N8356 --> N8359
  N8360[validateGcpEnvironment()]:::mth
  N8356 --> N8360
  N8362[File: cloud_runtime.config.ts]:::file
  N8180 --> N8362
  N8363[Class: CloudRuntimeConfigService]:::cls
  N8362 --> N8363
  N8364[getDatabaseUrl()]:::mth
  N8363 --> N8364
  N8365[getRedisUrl()]:::mth
  N8363 --> N8365
  N8366[getCloudRuntimeConfig()]:::mth
  N8363 --> N8366
  N8367[validateCloudRuntimeEnvironment()]:::mth
  N8363 --> N8367
  N8371[File: admin-config.controller.ts]:::file
  N8180 --> N8371
  N8372[Class: AdminConfigController]:::cls
  N8371 --> N8372
  N8373[getAllConfig()]:::mth
  N8372 --> N8373
  N8374[getLlmRoutingOptions()]:::mth
  N8372 --> N8374
  N8375[getLlmRoutingConfig()]:::mth
  N8372 --> N8375
  N8376[maskSensitiveValue()]:::mth
  N8372 --> N8376
  N8377[getCategoryForKey()]:::mth
  N8372 --> N8377
  N8378[File: admin-metrics.controller.ts]:::file
  N8180 --> N8378
  N8379[Class: AdminMetricsController]:::cls
  N8378 --> N8379
  N8380[getSystemMetrics()]:::mth
  N8379 --> N8380
  N8381[getDashboardMetrics()]:::mth
  N8379 --> N8381
  N8382[Date()]:::mth
  N8379 --> N8382
  N8383[parseInt()]:::mth
  N8379 --> N8383
  N8384[getChronologicalProcesses()]:::mth
  N8379 --> N8384
  N8385[File: admin-openclaw-oauth.controller.ts]:::file
  N8180 --> N8385
  N8386[Class: AdminOpenClawOAuthController]:::cls
  N8385 --> N8386
  N8387[assertSuperAdmin()]:::mth
  N8386 --> N8387
  N8388[normalizeProvider()]:::mth
  N8386 --> N8388
  N8389[getRotationAuditSnapshot()]:::mth
  N8386 --> N8389
  N8390[Number()]:::mth
  N8386 --> N8390
  N8391[File: admin-openclaw-runtime.controller.ts]:::file
  N8180 --> N8391
  N8392[Class: AdminOpenClawRuntimeController]:::cls
  N8391 --> N8392
  N8393[assertSuperAdmin()]:::mth
  N8392 --> N8393
  N8394[getActorId()]:::mth
  N8392 --> N8394
  N8395[toTargetOptions()]:::mth
  N8392 --> N8395
  N8396[File: admin-rclone-runtime.controller.ts]:::file
  N8180 --> N8396
  N8397[Class: AdminRcloneRuntimeController]:::cls
  N8396 --> N8397
  N8398[toBoolean()]:::mth
  N8397 --> N8398
  N8399[toInteger()]:::mth
  N8397 --> N8399
  N8400[getActorId()]:::mth
  N8397 --> N8400
  N8401[providers()]:::mth
  N8397 --> N8401
  N8402[String()]:::mth
  N8397 --> N8402
  N8403[File: admin-users.controller.ts]:::file
  N8180 --> N8403
  N8404[Class: AdminUsersController]:::cls
  N8403 --> N8404
  N8405[parseInt()]:::mth
  N8404 --> N8405
  N8406[Date()]:::mth
  N8404 --> N8406
  N8407[count()]:::mth
  N8404 --> N8407
  N8408[getUserStats()]:::mth
  N8404 --> N8408
  N8409[sanitizeUser()]:::mth
  N8404 --> N8409
  N8410[File: admin.controller.ts]:::file
  N8180 --> N8410
  N8411[Class: AdminController]:::cls
  N8410 --> N8411
  N8412[getRoles()]:::mth
  N8411 --> N8412
  N8413[getAuditLogs()]:::mth
  N8411 --> N8413
  N8414[getSystemMetrics()]:::mth
  N8411 --> N8414
  N8415[File: agent-bank.controller.ts]:::file
  N8180 --> N8415
  N8416[Class: AgentBankController]:::cls
  N8415 --> N8416
  N8417[File: agent-crafting.controller.ts]:::file
  N8180 --> N8417
  N8418[Class: AgentCraftingController]:::cls
  N8417 --> N8418
  N8419[assertWorkspaceAccess()]:::mth
  N8418 --> N8419
  N8420[File: agent-grants.controller.ts]:::file
  N8180 --> N8420
  N8421[Class: AgentGrantsController]:::cls
  N8420 --> N8421
  N8422[File: agent-handoff.controller.ts]:::file
  N8180 --> N8422
  N8423[Class: AgentHandoffController]:::cls
  N8422 --> N8423
  N8424[resolveTenantId()]:::mth
  N8423 --> N8424
  N8425[readTenantFromBody()]:::mth
  N8423 --> N8425
  N8426[readAgentIdFromBody()]:::mth
  N8423 --> N8426
  N8427[isPrivileged()]:::mth
  N8423 --> N8427
  N8428[hasPermission()]:::mth
  N8423 --> N8428
  N8429[File: agent-pfp-overrides.controller.ts]:::file
  N8180 --> N8429
  N8430[Class: AgentPfpOverridesController]:::cls
  N8429 --> N8430
  N8431[generateImage()]:::mth
  N8430 --> N8431
  N8432[BadGatewayException()]:::mth
  N8430 --> N8432
  N8433[resolveApiKey()]:::mth
  N8430 --> N8433
  N8434[readImageResponse()]:::mth
  N8430 --> N8434
  N8435[BadGatewayException()]:::mth
  N8430 --> N8435
  N8436[File: agent-proxy.controller.ts]:::file
  N8180 --> N8436
  N8437[Class: AgentProxyController]:::cls
  N8436 --> N8437
  N8438[target()]:::mth
  N8437 --> N8438
  N8439[File: agent.controller.ts]:::file
  N8180 --> N8439
  N8440[Class: AgentController]:::cls
  N8439 --> N8440
  N8441[parseInt()]:::mth
  N8440 --> N8441
  N8442[normalizeMetadata()]:::mth
  N8440 --> N8442
  N8443[assertMetadataScope()]:::mth
  N8440 --> N8443
  N8444[File: ai.controller.ts]:::file
  N8180 --> N8444
  N8445[Class: AiController]:::cls
  N8444 --> N8445
  N8446[getPreferredProvider()]:::mth
  N8445 --> N8446
  N8447[getEnvFallbackProvider()]:::mth
  N8445 --> N8447
  N8448[resolveTextEndpoint()]:::mth
  N8445 --> N8448
  N8449[resolveImageEndpoint()]:::mth
  N8445 --> N8449
  N8450[buildProviderHeaders()]:::mth
  N8445 --> N8450
  N8451[File: auth.controller.ts]:::file
  N8180 --> N8451
  N8452[Class: AuthController]:::cls
  N8451 --> N8452
  N8453[invitePolicy()]:::mth
  N8452 --> N8453
  N8454[logout()]:::mth
  N8452 --> N8454
  N8455[assertAdmin()]:::mth
  N8452 --> N8455
  N8456[File: chat.controller.ts]:::file
  N8180 --> N8456
  N8457[Class: ChatController]:::cls
  N8456 --> N8457
  N8458[getRooms()]:::mth
  N8457 --> N8458
  N8459[getAnalytics()]:::mth
  N8457 --> N8459
  N8460[File: claude-dev-automation.controller.ts]:::file
  N8180 --> N8460
  N8461[Class: ClaudeDevCreateAgentDto]:::cls
  N8460 --> N8461
  N8462[getHealthStatus()]:::mth
  N8461 --> N8462
  N8463[validateTenantId()]:::mth
  N8461 --> N8463
  N8464[validateAgentId()]:::mth
  N8461 --> N8464
  N8465[validateCreateAgentDto()]:::mth
  N8461 --> N8465
  N8466[validateExecuteTaskDto()]:::mth
  N8461 --> N8466
  N8467[Class: ClaudeDevUpdateAgentDto]:::cls
  N8460 --> N8467
  N8468[getHealthStatus()]:::mth
  N8467 --> N8468
  N8469[validateTenantId()]:::mth
  N8467 --> N8469
  N8470[validateAgentId()]:::mth
  N8467 --> N8470
  N8471[validateCreateAgentDto()]:::mth
  N8467 --> N8471
  N8472[validateExecuteTaskDto()]:::mth
  N8467 --> N8472
  N8473[Class: ExecuteTaskDto]:::cls
  N8460 --> N8473
  N8474[getHealthStatus()]:::mth
  N8473 --> N8474
  N8475[validateTenantId()]:::mth
  N8473 --> N8475
  N8476[validateAgentId()]:::mth
  N8473 --> N8476
  N8477[validateCreateAgentDto()]:::mth
  N8473 --> N8477
  N8478[validateExecuteTaskDto()]:::mth
  N8473 --> N8478
  N8479[Class: CreateAgentBatchDto]:::cls
  N8460 --> N8479
  N8480[getHealthStatus()]:::mth
  N8479 --> N8480
  N8481[validateTenantId()]:::mth
  N8479 --> N8481
  N8482[validateAgentId()]:::mth
  N8479 --> N8482
  N8483[validateCreateAgentDto()]:::mth
  N8479 --> N8483
  N8484[validateExecuteTaskDto()]:::mth
  N8479 --> N8484
  N8485[Class: TemplateCustomizationDto]:::cls
  N8460 --> N8485
  N8486[getHealthStatus()]:::mth
  N8485 --> N8486
  N8487[validateTenantId()]:::mth
  N8485 --> N8487
  N8488[validateAgentId()]:::mth
  N8485 --> N8488
  N8489[validateCreateAgentDto()]:::mth
  N8485 --> N8489
  N8490[validateExecuteTaskDto()]:::mth
  N8485 --> N8490
  N8491[Class: ClaudeDevAutomationController]:::cls
  N8460 --> N8491
  N8492[getHealthStatus()]:::mth
  N8491 --> N8492
  N8493[validateTenantId()]:::mth
  N8491 --> N8493
  N8494[validateAgentId()]:::mth
  N8491 --> N8494
  N8495[validateCreateAgentDto()]:::mth
  N8491 --> N8495
  N8496[validateExecuteTaskDto()]:::mth
  N8491 --> N8496
  N8497[File: community.controller.ts]:::file
  N8180 --> N8497
  N8498[Class: CommunityController]:::cls
  N8497 --> N8498
  N8499[getStats()]:::mth
  N8498 --> N8499
  N8500[File: compounding-memory.controller.ts]:::file
  N8180 --> N8500
  N8501[Class: CompoundingMemoryController]:::cls
  N8500 --> N8501
  N8502[getClusters()]:::mth
  N8501 --> N8502
  N8503[getIndices()]:::mth
  N8501 --> N8503
  N8504[File: export.controller.ts]:::file
  N8180 --> N8504
  N8505[Class: ConversationExportService]:::cls
  N8504 --> N8505
  N8506[export()]:::mth
  N8505 --> N8506
  N8507[toMarkdown()]:::mth
  N8505 --> N8507
  N8508[toHtml()]:::mth
  N8505 --> N8508
  N8509[escapeHtml()]:::mth
  N8505 --> N8509
  N8510[Class: ExportController]:::cls
  N8504 --> N8510
  N8511[export()]:::mth
  N8510 --> N8511
  N8512[toMarkdown()]:::mth
  N8510 --> N8512
  N8513[toHtml()]:::mth
  N8510 --> N8513
  N8514[escapeHtml()]:::mth
  N8510 --> N8514
  N8515[File: feature.controller.ts]:::file
  N8180 --> N8515
  N8516[Class: FeatureController]:::cls
  N8515 --> N8516
  N8517[getFeatureFlags()]:::mth
  N8516 --> N8517
  N8518[File: health.controller.ts]:::file
  N8180 --> N8518
  N8519[Class: HealthController]:::cls
  N8518 --> N8519
  N8520[parseInt()]:::mth
  N8519 --> N8520
  N8521[check()]:::mth
  N8519 --> N8521
  N8522[File: llm-intel.controller.ts]:::file
  N8180 --> N8522
  N8523[Class: LLMIntelController]:::cls
  N8522 --> N8523
  N8524[getRankingRecommendations()]:::mth
  N8523 --> N8524
  N8525[getArenaIntelLatest()]:::mth
  N8523 --> N8525
  N8526[getRankingReport()]:::mth
  N8523 --> N8526
  N8527[getHistory()]:::mth
  N8523 --> N8527
  N8528[File: mcp.controller.ts]:::file
  N8180 --> N8528
  N8529[Class: MCPServerController]:::cls
  N8528 --> N8529
  N8530[tnfMcpServers()]:::mth
  N8529 --> N8530
  N8531[Number()]:::mth
  N8529 --> N8531
  N8532[getAllConnections()]:::mth
  N8529 --> N8532
  N8533[getConfig()]:::mth
  N8529 --> N8533
  N8534[File: models.controller.ts]:::file
  N8180 --> N8534
  N8535[Class: ModelsController]:::cls
  N8534 --> N8535
  N8536[getProviders()]:::mth
  N8535 --> N8536
  N8537[getActiveModel()]:::mth
  N8535 --> N8537
  N8538[File: monitoring.controller.ts]:::file
  N8180 --> N8538
  N8539[Class: MonitoringController]:::cls
  N8538 --> N8539
  N8540[getMetrics()]:::mth
  N8539 --> N8540
  N8541[getMemory()]:::mth
  N8539 --> N8541
  N8542[getAppMetrics()]:::mth
  N8539 --> N8542
  N8543[getHealth()]:::mth
  N8539 --> N8543
  N8544[measureEventLoopLag()]:::mth
  N8539 --> N8544
  N8545[File: n8n-workflows.controller.ts]:::file
  N8180 --> N8545
  N8546[Class: N8nWorkflowsController]:::cls
  N8545 --> N8546
  N8547[parseInt()]:::mth
  N8546 --> N8547
  N8548[listCategories()]:::mth
  N8546 --> N8548
  N8549[getStats()]:::mth
  N8546 --> N8549
  N8550[getTags()]:::mth
  N8546 --> N8550
  N8551[parseInt()]:::mth
  N8546 --> N8551
  N8552[File: onboarding.controller.integration.spec.ts]:::file
  N8180 --> N8552
  N8553[Class: TestHttpExceptionFilter]:::cls
  N8552 --> N8553
  N8555[File: onboarding.controller.ts]:::file
  N8180 --> N8555
  N8556[Class: OnboardingController]:::cls
  N8555 --> N8556
  N8557[detectUserType()]:::mth
  N8556 --> N8557
  N8558[validateOnboardingToken()]:::mth
  N8556 --> N8558
  N8559[pickFirst()]:::mth
  N8556 --> N8559
  N8560[headerValue()]:::mth
  N8556 --> N8560
  N8561[queryValue()]:::mth
  N8556 --> N8561
  N8562[File: orchestration.controller.ts]:::file
  N8180 --> N8562
  N8563[Class: OrchestrationController]:::cls
  N8562 --> N8563
  N8564[normalizeContext()]:::mth
  N8563 --> N8564
  N8565[assertContextAccess()]:::mth
  N8563 --> N8565
  N8566[normalizeProvider()]:::mth
  N8563 --> N8566
  N8567[resolveProviderForUser()]:::mth
  N8563 --> N8567
  N8568[resolveSpecificProvider()]:::mth
  N8563 --> N8568
  N8569[File: orchestrator.controller.ts]:::file
  N8180 --> N8569
  N8570[Class: OrchestratorController]:::cls
  N8569 --> N8570
  N8571[getHealth()]:::mth
  N8570 --> N8571
  N8572[getAgents()]:::mth
  N8570 --> N8572
  N8573[File: prompt-templates.controller.ts]:::file
  N8180 --> N8573
  N8574[Class: PromptTemplatesController]:::cls
  N8573 --> N8574
  N8575[File: provider-keys.controller.ts]:::file
  N8180 --> N8575
  N8576[Class: ProviderKeysController]:::cls
  N8575 --> N8576
  N8577[File: relay-health.controller.ts]:::file
  N8180 --> N8577
  N8578[Class: RelayHealthController]:::cls
  N8577 --> N8578
  N8579[getHealth()]:::mth
  N8578 --> N8579
  N8580[getAgents()]:::mth
  N8578 --> N8580
  N8581[recordHeartbeat()]:::mth
  N8578 --> N8581
  N8582[File: security.controller.ts]:::file
  N8180 --> N8582
  N8583[Class: SecurityTestRequestDto]:::cls
  N8582 --> N8583
  N8584[runSecurityTests()]:::mth
  N8583 --> N8584
  N8585[securityHealthCheck()]:::mth
  N8583 --> N8585
  N8586[getSecurityConfig()]:::mth
  N8583 --> N8586
  N8587[Class: TestXSSDto]:::cls
  N8582 --> N8587
  N8588[runSecurityTests()]:::mth
  N8587 --> N8588
  N8589[securityHealthCheck()]:::mth
  N8587 --> N8589
  N8590[getSecurityConfig()]:::mth
  N8587 --> N8590
  N8591[Class: TestSQLInjectionDto]:::cls
  N8582 --> N8591
  N8592[runSecurityTests()]:::mth
  N8591 --> N8592
  N8593[securityHealthCheck()]:::mth
  N8591 --> N8593
  N8594[getSecurityConfig()]:::mth
  N8591 --> N8594
  N8595[Class: TestResponseSanitizationDto]:::cls
  N8582 --> N8595
  N8596[runSecurityTests()]:::mth
  N8595 --> N8596
  N8597[securityHealthCheck()]:::mth
  N8595 --> N8597
  N8598[getSecurityConfig()]:::mth
  N8595 --> N8598
  N8599[Class: SecurityController]:::cls
  N8582 --> N8599
  N8600[runSecurityTests()]:::mth
  N8599 --> N8600
  N8601[securityHealthCheck()]:::mth
  N8599 --> N8601
  N8602[getSecurityConfig()]:::mth
  N8599 --> N8602
  N8603[File: self-improvement.controller.ts]:::file
  N8180 --> N8603
  N8604[Class: SelfImprovementController]:::cls
  N8603 --> N8604
  N8605[startCycle()]:::mth
  N8604 --> N8605
  N8606[getCycleStatus()]:::mth
  N8604 --> N8606
  N8607[getCycleReport()]:::mth
  N8604 --> N8607
  N8608[getChatHistory()]:::mth
  N8604 --> N8608
  N8609[runAnalysis()]:::mth
  N8604 --> N8609
  N8610[File: system.controller.ts]:::file
  N8180 --> N8610
  N8611[Class: SystemController]:::cls
  N8610 --> N8611
  N8612[getMasterClockTelemetry()]:::mth
  N8611 --> N8612
  N8613[log()]:::mth
  N8611 --> N8613
  N8614[getHealth()]:::mth
  N8611 --> N8614
  N8615[parsePositiveInt()]:::mth
  N8611 --> N8615
  N8616[buildProcessStats()]:::mth
  N8611 --> N8616
  N8617[File: tnf-autonomous.controller.ts]:::file
  N8180 --> N8617
  N8618[Class: TNFAutonomousController]:::cls
  N8617 --> N8618
  N8619[getSystemStatus()]:::mth
  N8618 --> N8619
  N8620[getHealth()]:::mth
  N8618 --> N8620
  N8621[getDirectorStatus()]:::mth
  N8618 --> N8621
  N8622[startDirector()]:::mth
  N8618 --> N8622
  N8623[stopDirector()]:::mth
  N8618 --> N8623
  N8624[File: user-management.controller.ts]:::file
  N8180 --> N8624
  N8625[Class: UserManagementController]:::cls
  N8624 --> N8625
  N8626[getAllUsers()]:::mth
  N8625 --> N8626
  N8627[sanitizeUser()]:::mth
  N8625 --> N8627
  N8628[File: visualizations.controller.ts]:::file
  N8180 --> N8628
  N8629[Class: VisualizationsController]:::cls
  N8628 --> N8629
  N8630[getGraphArtifactsIndex()]:::mth
  N8629 --> N8630
  N8631[File: websocket.controller.ts]:::file
  N8180 --> N8631
  N8632[Class: WebSocketController]:::cls
  N8631 --> N8632
  N8633[getStatus()]:::mth
  N8632 --> N8633
  N8634[startServer()]:::mth
  N8632 --> N8634
  N8635[stopServer()]:::mth
  N8632 --> N8635
  N8636[broadcast()]:::mth
  N8632 --> N8636
  N8637[setupEventHandlers()]:::mth
  N8632 --> N8637
  N8638[File: workflow-templates.controller.ts]:::file
  N8180 --> N8638
  N8639[Class: WorkflowTemplatesController]:::cls
  N8638 --> N8639
  N8640[File: workflow.controller.ts]:::file
  N8180 --> N8640
  N8641[Class: WorkflowController]:::cls
  N8640 --> N8641
  N8642[and()]:::mth
  N8641 --> N8642
  N8643[getTemplates()]:::mth
  N8641 --> N8643
  N8644[File: workspace.controller.ts]:::file
  N8180 --> N8644
  N8645[Class: CreateWorkspaceDto]:::cls
  N8644 --> N8645
  N8646[onModuleInit()]:::mth
  N8645 --> N8646
  N8647[onModuleDestroy()]:::mth
  N8645 --> N8647
  N8648[isHostMariaAutoSyncEnabled()]:::mth
  N8645 --> N8648
  N8649[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8645 --> N8649
  N8650[getHostMariaAutoSyncIntervalMs()]:::mth
  N8645 --> N8650
  N8651[Class: UpdateWorkspaceDto]:::cls
  N8644 --> N8651
  N8652[onModuleInit()]:::mth
  N8651 --> N8652
  N8653[onModuleDestroy()]:::mth
  N8651 --> N8653
  N8654[isHostMariaAutoSyncEnabled()]:::mth
  N8651 --> N8654
  N8655[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8651 --> N8655
  N8656[getHostMariaAutoSyncIntervalMs()]:::mth
  N8651 --> N8656
  N8657[Class: AddWorkspaceMemberDto]:::cls
  N8644 --> N8657
  N8658[onModuleInit()]:::mth
  N8657 --> N8658
  N8659[onModuleDestroy()]:::mth
  N8657 --> N8659
  N8660[isHostMariaAutoSyncEnabled()]:::mth
  N8657 --> N8660
  N8661[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8657 --> N8661
  N8662[getHostMariaAutoSyncIntervalMs()]:::mth
  N8657 --> N8662
  N8663[Class: UpdateWorkspaceMemberRoleDto]:::cls
  N8644 --> N8663
  N8664[onModuleInit()]:::mth
  N8663 --> N8664
  N8665[onModuleDestroy()]:::mth
  N8663 --> N8665
  N8666[isHostMariaAutoSyncEnabled()]:::mth
  N8663 --> N8666
  N8667[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8663 --> N8667
  N8668[getHostMariaAutoSyncIntervalMs()]:::mth
  N8663 --> N8668
  N8669[Class: SetWorkspaceSubAccessDto]:::cls
  N8644 --> N8669
  N8670[onModuleInit()]:::mth
  N8669 --> N8670
  N8671[onModuleDestroy()]:::mth
  N8669 --> N8671
  N8672[isHostMariaAutoSyncEnabled()]:::mth
  N8669 --> N8672
  N8673[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8669 --> N8673
  N8674[getHostMariaAutoSyncIntervalMs()]:::mth
  N8669 --> N8674
  N8675[Class: UpdateWorkspaceSubAccessDto]:::cls
  N8644 --> N8675
  N8676[onModuleInit()]:::mth
  N8675 --> N8676
  N8677[onModuleDestroy()]:::mth
  N8675 --> N8677
  N8678[isHostMariaAutoSyncEnabled()]:::mth
  N8675 --> N8678
  N8679[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8675 --> N8679
  N8680[getHostMariaAutoSyncIntervalMs()]:::mth
  N8675 --> N8680
  N8681[Class: CreateWorkspaceDomainDto]:::cls
  N8644 --> N8681
  N8682[onModuleInit()]:::mth
  N8681 --> N8682
  N8683[onModuleDestroy()]:::mth
  N8681 --> N8683
  N8684[isHostMariaAutoSyncEnabled()]:::mth
  N8681 --> N8684
  N8685[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8681 --> N8685
  N8686[getHostMariaAutoSyncIntervalMs()]:::mth
  N8681 --> N8686
  N8687[Class: CreateWorkspaceBookmarkDto]:::cls
  N8644 --> N8687
  N8688[onModuleInit()]:::mth
  N8687 --> N8688
  N8689[onModuleDestroy()]:::mth
  N8687 --> N8689
  N8690[isHostMariaAutoSyncEnabled()]:::mth
  N8687 --> N8690
  N8691[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8687 --> N8691
  N8692[getHostMariaAutoSyncIntervalMs()]:::mth
  N8687 --> N8692
  N8693[Class: UpdateWorkspaceBookmarkDto]:::cls
  N8644 --> N8693
  N8694[onModuleInit()]:::mth
  N8693 --> N8694
  N8695[onModuleDestroy()]:::mth
  N8693 --> N8695
  N8696[isHostMariaAutoSyncEnabled()]:::mth
  N8693 --> N8696
  N8697[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8693 --> N8697
  N8698[getHostMariaAutoSyncIntervalMs()]:::mth
  N8693 --> N8698
  N8699[Class: WorkspaceController]:::cls
  N8644 --> N8699
  N8700[onModuleInit()]:::mth
  N8699 --> N8700
  N8701[onModuleDestroy()]:::mth
  N8699 --> N8701
  N8702[isHostMariaAutoSyncEnabled()]:::mth
  N8699 --> N8702
  N8703[shouldRunHostMariaAutoSyncOnStart()]:::mth
  N8699 --> N8703
  N8704[getHostMariaAutoSyncIntervalMs()]:::mth
  N8699 --> N8704
  N8708[File: agent-grants.dto.ts]:::file
  N8180 --> N8708
  N8709[Class: CreateAgentGrantDto]:::cls
  N8708 --> N8709
  N8710[File: email-custodian.dto.ts]:::file
  N8180 --> N8710
  N8711[Class: ProvisionManagedAccountDto]:::cls
  N8710 --> N8711
  N8712[Class: CreateManagedAccountGrantDto]:::cls
  N8710 --> N8712
  N8713[Class: RedeemManagedAccountGrantDto]:::cls
  N8710 --> N8713
  N8714[File: login.dto.ts]:::file
  N8180 --> N8714
  N8715[Class: LoginDto]:::cls
  N8714 --> N8715
  N8716[File: openclaw-oauth-rotation.dto.ts]:::file
  N8180 --> N8716
  N8717[Class: UpsertOpenClawOAuthBindingDto]:::cls
  N8716 --> N8717
  N8718[Class: ExecuteOpenClawOAuthBindingDto]:::cls
  N8716 --> N8718
  N8719[File: provider-keys.dto.ts]:::file
  N8180 --> N8719
  N8720[Class: SaveProviderKeyDto]:::cls
  N8719 --> N8720
  N8721[File: provision-agent-template.dto.ts]:::file
  N8180 --> N8721
  N8722[Class: ProvisionAgentTemplateDto]:::cls
  N8721 --> N8722
  N8723[File: register.dto.ts]:::file
  N8180 --> N8723
  N8724[Class: RegisterDto]:::cls
  N8723 --> N8724
  N8725[File: agent.dto.ts]:::file
  N8180 --> N8725
  N8726[Class: CreateAgentDto]:::cls
  N8725 --> N8726
  N8727[Class: UpdateAgentDto]:::cls
  N8725 --> N8727
  N8728[Class: AgentResponseDto]:::cls
  N8725 --> N8728
  N8729[File: auth.dto.ts]:::file
  N8180 --> N8729
  N8730[Class: LoginDto]:::cls
  N8729 --> N8730
  N8731[Class: RegisterDto]:::cls
  N8729 --> N8731
  N8732[Class: TokenDto]:::cls
  N8729 --> N8732
  N8733[Class: GenerateInviteCodeDto]:::cls
  N8729 --> N8733
  N8734[Class: SupabaseAuthDto]:::cls
  N8729 --> N8734
  N8735[File: enhanced-validation.dto.ts]:::file
  N8180 --> N8735
  N8736[Class: PaginationDto]:::cls
  N8735 --> N8736
  N8737[Class: SearchDto]:::cls
  N8735 --> N8737
  N8738[Class: ContactDto]:::cls
  N8735 --> N8738
  N8739[Class: UserProfileDto]:::cls
  N8735 --> N8739
  N8740[Class: AddressDto]:::cls
  N8735 --> N8740
  N8741[Class: FileUploadDto]:::cls
  N8735 --> N8741
  N8742[Class: NotificationDto]:::cls
  N8735 --> N8742
  N8743[Class: ApiKeyDto]:::cls
  N8735 --> N8743
  N8744[Class: LogQueryDto]:::cls
  N8735 --> N8744
  N8745[Class: WebhookDto]:::cls
  N8735 --> N8745
  N8746[Class: FeedbackDto]:::cls
  N8735 --> N8746
  N8747[File: login.dto.ts]:::file
  N8180 --> N8747
  N8748[Class: LoginDto]:::cls
  N8747 --> N8748
  N8749[File: message.dto.ts]:::file
  N8180 --> N8749
  N8750[Class: CreateMessageDto]:::cls
  N8749 --> N8750
  N8751[Class: MessageResponseDto]:::cls
  N8749 --> N8751
  N8752[File: register.dto.ts]:::file
  N8180 --> N8752
  N8753[Class: RegisterDto]:::cls
  N8752 --> N8753
  N8754[File: workflow.dto.ts]:::file
  N8180 --> N8754
  N8755[Class: WorkflowStepDto]:::cls
  N8754 --> N8755
  N8756[Class: CreateWorkflowDto]:::cls
  N8754 --> N8756
  N8757[Class: UpdateWorkflowDto]:::cls
  N8754 --> N8757
  N8758[Class: WorkflowResponseDto]:::cls
  N8754 --> N8758
  N8760[File: graphql.module.ts]:::file
  N8180 --> N8760
  N8761[Class: GraphqlModule]:::cls
  N8760 --> N8761
  N8762[join()]:::mth
  N8761 --> N8762
  N8763[File: gql-auth.guard.ts]:::file
  N8180 --> N8763
  N8764[Class: GqlAuthGuard]:::cls
  N8763 --> N8764
  N8765[canActivate()]:::mth
  N8764 --> N8765
  N8766[getClientIP()]:::mth
  N8764 --> N8766
  N8767[File: agent.loader.ts]:::file
  N8180 --> N8767
  N8768[Class: AgentLoader]:::cls
  N8767 --> N8768
  N8769[load()]:::mth
  N8768 --> N8769
  N8770[loadMany()]:::mth
  N8768 --> N8770
  N8771[loadByUserId()]:::mth
  N8768 --> N8771
  N8772[File: user.loader.ts]:::file
  N8180 --> N8772
  N8773[Class: UserLoader]:::cls
  N8772 --> N8773
  N8774[load()]:::mth
  N8773 --> N8774
  N8775[loadMany()]:::mth
  N8773 --> N8775
  N8776[File: workflow.loader.ts]:::file
  N8180 --> N8776
  N8777[Class: WorkflowLoader]:::cls
  N8776 --> N8777
  N8778[load()]:::mth
  N8777 --> N8778
  N8779[loadMany()]:::mth
  N8777 --> N8779
  N8780[loadByUserId()]:::mth
  N8777 --> N8780
  N8781[loadStepsByWorkflowId()]:::mth
  N8777 --> N8781
  N8782[File: agent.resolver.ts]:::file
  N8180 --> N8782
  N8783[Class: AgentResolver]:::cls
  N8782 --> N8783
  N8784[File: user.resolver.ts]:::file
  N8180 --> N8784
  N8785[Class: UserResolver]:::cls
  N8784 --> N8785
  N8786[users()]:::mth
  N8785 --> N8786
  N8787[File: workflow.resolver.ts]:::file
  N8180 --> N8787
  N8788[Class: WorkflowResolver]:::cls
  N8787 --> N8788
  N8789[File: agent.type.ts]:::file
  N8180 --> N8789
  N8790[Class: AgentType]:::cls
  N8789 --> N8790
  N8791[File: input.types.ts]:::file
  N8180 --> N8791
  N8792[Class: CreateAgentInput]:::cls
  N8791 --> N8792
  N8793[Class: UpdateAgentInput]:::cls
  N8791 --> N8793
  N8794[Class: ExecuteWorkflowInput]:::cls
  N8791 --> N8794
  N8795[Class: CreateWorkflowInput]:::cls
  N8791 --> N8795
  N8796[File: user.type.ts]:::file
  N8180 --> N8796
  N8797[Class: UserType]:::cls
  N8796 --> N8797
  N8798[File: workflow-step.type.ts]:::file
  N8180 --> N8798
  N8799[Class: WorkflowStepStatisticsType]:::cls
  N8798 --> N8799
  N8800[Class: WorkflowStepType]:::cls
  N8798 --> N8800
  N8801[File: workflow.type.ts]:::file
  N8180 --> N8801
  N8802[Class: WorkflowStatisticsType]:::cls
  N8801 --> N8802
  N8803[Class: WorkflowType]:::cls
  N8801 --> N8803
  N8804[File: admin.guard.integration.spec.ts]:::file
  N8180 --> N8804
  N8805[Class: TestAuthGuard]:::cls
  N8804 --> N8805
  N8806[canActivate()]:::mth
  N8805 --> N8806
  N8807[ok()]:::mth
  N8805 --> N8807
  N8808[Class: AdminGuardProbeController]:::cls
  N8804 --> N8808
  N8809[canActivate()]:::mth
  N8808 --> N8809
  N8810[ok()]:::mth
  N8808 --> N8810
  N8812[File: admin.guard.ts]:::file
  N8180 --> N8812
  N8813[Class: AdminGuard]:::cls
  N8812 --> N8813
  N8814[canActivate()]:::mth
  N8813 --> N8814
  N8815[File: auth.guard.ts]:::file
  N8180 --> N8815
  N8816[Class: AuthGuard]:::cls
  N8815 --> N8816
  N8817[canActivate()]:::mth
  N8816 --> N8817
  N8818[extractTokenFromHeader()]:::mth
  N8816 --> N8818
  N8819[File: community-api-key.guard.ts]:::file
  N8180 --> N8819
  N8820[Class: CommunityApiKeyGuard]:::cls
  N8819 --> N8820
  N8821[canActivate()]:::mth
  N8820 --> N8821
  N8822[File: jwt-auth.guard.ts]:::file
  N8180 --> N8822
  N8823[Class: JwtAuthGuard]:::cls
  N8822 --> N8823
  N8824[canActivate()]:::mth
  N8823 --> N8824
  N8825[extractTokenFromHeader()]:::mth
  N8823 --> N8825
  N8826[File: member-or-admin.decorator.integration.spec.ts]:::file
  N8180 --> N8826
  N8827[Class: MockJwtGuard]:::cls
  N8826 --> N8827
  N8828[canActivate()]:::mth
  N8827 --> N8828
  N8829[runProtectedAction()]:::mth
  N8827 --> N8829
  N8830[Class: TestMemberOrAdminController]:::cls
  N8826 --> N8830
  N8831[canActivate()]:::mth
  N8830 --> N8831
  N8832[runProtectedAction()]:::mth
  N8830 --> N8832
  N8834[File: member-or-admin.guard.ts]:::file
  N8180 --> N8834
  N8835[Class: MemberOrAdminGuard]:::cls
  N8834 --> N8835
  N8836[canActivate()]:::mth
  N8835 --> N8836
  N8837[MemberOrAdmin()]:::mth
  N8835 --> N8837
  N8838[File: roles.guard.spec.ts]:::file
  N8180 --> N8838
  N8839[Class: TestController]:::cls
  N8838 --> N8839
  N8840[File: roles.guard.ts]:::file
  N8180 --> N8840
  N8841[Class: RolesGuard]:::cls
  N8840 --> N8841
  N8842[canActivate()]:::mth
  N8841 --> N8842
  N8843[File: secure-auth.guard.ts]:::file
  N8180 --> N8843
  N8844[Class: SecureAuthGuard]:::cls
  N8843 --> N8844
  N8845[RequireAuthLevel()]:::mth
  N8844 --> N8845
  N8846[SetRateLimitTier()]:::mth
  N8844 --> N8846
  N8847[SetSecurityLevel()]:::mth
  N8844 --> N8847
  N8848[RequireSSL()]:::mth
  N8844 --> N8848
  N8849[AuditLog()]:::mth
  N8844 --> N8849
  N8850[File: security.guard.ts]:::file
  N8180 --> N8850
  N8851[Class: SecurityGuard]:::cls
  N8850 --> N8851
  N8852[canActivate()]:::mth
  N8851 --> N8852
  N8853[getSecurityOptions()]:::mth
  N8851 --> N8853
  N8854[checkRateLimit()]:::mth
  N8851 --> N8854
  N8855[validateAndSanitizeInput()]:::mth
  N8851 --> N8855
  N8856[addSecurityHeaders()]:::mth
  N8851 --> N8856
  N8858[File: LLMRegistry.ts]:::file
  N8180 --> N8858
  N8859[Class: LLMRegistry]:::cls
  N8858 --> N8859
  N8860[registerProvider()]:::mth
  N8859 --> N8860
  N8861[getProvider()]:::mth
  N8859 --> N8861
  N8862[getAllProviders()]:::mth
  N8859 --> N8862
  N8863[removeProvider()]:::mth
  N8859 --> N8863
  N8864[File: create-provider.dto.ts]:::file
  N8180 --> N8864
  N8865[Class: CreateProviderDto]:::cls
  N8864 --> N8865
  N8866[File: llm-provider.controller.ts]:::file
  N8180 --> N8866
  N8867[Class: LLMProviderController]:::cls
  N8866 --> N8867
  N8868[findAll()]:::mth
  N8867 --> N8868
  N8869[registerClaudeCodeCLI()]:::mth
  N8867 --> N8869
  N8870[registerGeminiCLI()]:::mth
  N8867 --> N8870
  N8871[File: llm-provider.service.ts]:::file
  N8180 --> N8871
  N8872[Class: MockLLMRegistry]:::cls
  N8871 --> N8872
  N8873[registerProvider()]:::mth
  N8872 --> N8873
  N8874[registerProvider()]:::mth
  N8872 --> N8874
  N8875[unregisterProvider()]:::mth
  N8872 --> N8875
  N8876[findAll()]:::mth
  N8872 --> N8876
  N8877[create()]:::mth
  N8872 --> N8877
  N8878[Class: LLMProviderService]:::cls
  N8871 --> N8878
  N8879[registerProvider()]:::mth
  N8878 --> N8879
  N8880[registerProvider()]:::mth
  N8878 --> N8880
  N8881[unregisterProvider()]:::mth
  N8878 --> N8881
  N8882[findAll()]:::mth
  N8878 --> N8882
  N8883[create()]:::mth
  N8878 --> N8883
  N8886[File: TNFClaudeDevMCPServer.ts]:::file
  N8180 --> N8886
  N8887[Class: TNFClaudeDevMCPServer]:::cls
  N8886 --> N8887
  N8888[initializeTools()]:::mth
  N8887 --> N8888
  N8889[handleInitialize()]:::mth
  N8887 --> N8889
  N8890[handleListTools()]:::mth
  N8887 --> N8890
  N8891[handleToolCall()]:::mth
  N8887 --> N8891
  N8892[handleListTemplates()]:::mth
  N8887 --> N8892
  N8893[File: TNFMCPController.ts]:::file
  N8180 --> N8893
  N8894[Class: TNFMCPController]:::cls
  N8893 --> N8894
  N8895[getStatus()]:::mth
  N8894 --> N8895
  N8896[getHealth()]:::mth
  N8894 --> N8896
  N8897[getMarketplaceServers()]:::mth
  N8894 --> N8897
  N8898[File: TNFMCPModule.ts]:::file
  N8180 --> N8898
  N8899[Class: TNFMCPModule]:::cls
  N8898 --> N8899
  N8900[File: TNFMCPService.ts]:::file
  N8180 --> N8900
  N8901[Class: TNFMCPService]:::cls
  N8900 --> N8901
  N8902[onModuleInit()]:::mth
  N8901 --> N8902
  N8903[getMCPServer()]:::mth
  N8901 --> N8903
  N8904[startRemoteServer()]:::mth
  N8901 --> N8904
  N8905[getServerStatus()]:::mth
  N8901 --> N8905
  N8906[File: TheNewFuseMCPServer.ts]:::file
  N8180 --> N8906
  N8907[Class: TheNewFuseMCPServer]:::cls
  N8906 --> N8907
  N8908[setServices()]:::mth
  N8907 --> N8908
  N8909[setupToolHandlers()]:::mth
  N8907 --> N8909
  N8910[Banks()]:::mth
  N8907 --> N8910
  N8911[Tools()]:::mth
  N8907 --> N8911
  N8912[handleListAgents()]:::mth
  N8907 --> N8912
  N8914[File: agent-tracking.middleware.ts]:::file
  N8180 --> N8914
  N8915[Class: AgentTrackingMiddleware]:::cls
  N8914 --> N8915
  N8916[use()]:::mth
  N8915 --> N8916
  N8917[extractTrackingInfo()]:::mth
  N8915 --> N8917
  N8918[generateRequestId()]:::mth
  N8915 --> N8918
  N8919[extractIpAddress()]:::mth
  N8915 --> N8919
  N8920[isValidIp()]:::mth
  N8915 --> N8920
  N8923[File: csrf-protection.middleware.ts]:::file
  N8180 --> N8923
  N8924[Class: CsrfProtectionMiddleware]:::cls
  N8923 --> N8924
  N8925[use()]:::mth
  N8924 --> N8925
  N8926[shouldSkipCsrfCheck()]:::mth
  N8924 --> N8926
  N8927[isStateChangingRequest()]:::mth
  N8924 --> N8927
  N8928[getSessionId()]:::mth
  N8924 --> N8928
  N8929[extractSessionFromAuthHeader()]:::mth
  N8924 --> N8929
  N8930[File: enhanced-error-handler.middleware.ts]:::file
  N8180 --> N8930
  N8931[Class: EnhancedErrorHandlerMiddleware]:::cls
  N8930 --> N8931
  N8932[getHandler()]:::mth
  N8931 --> N8932
  N8933[createErrorResponse()]:::mth
  N8931 --> N8933
  N8934[handleValidationError()]:::mth
  N8931 --> N8934
  N8935[handleUnauthorizedError()]:::mth
  N8931 --> N8935
  N8936[handleForbiddenError()]:::mth
  N8931 --> N8936
  N8937[File: enhanced-security.middleware.ts]:::file
  N8180 --> N8937
  N8938[Class: EnhancedSecurityMiddleware]:::cls
  N8937 --> N8938
  N8939[use()]:::mth
  N8938 --> N8939
  N8940[performSecurityAnalysis()]:::mth
  N8938 --> N8940
  N8941[enforceRateLimiting()]:::mth
  N8938 --> N8941
  N8942[sanitizeAndValidateInput()]:::mth
  N8938 --> N8942
  N8943[injectSecurityHeaders()]:::mth
  N8938 --> N8943
  N8944[File: errorHandler.ts]:::file
  N8180 --> N8944
  N8945[Class: ApiError]:::cls
  N8944 --> N8945
  N8946[File: query-optimizer.interceptor.ts]:::file
  N8180 --> N8946
  N8947[Class: QueryOptimizerInterceptor]:::cls
  N8946 --> N8947
  N8948[intercept()]:::mth
  N8947 --> N8948
  N8949[recordQuery()]:::mth
  N8947 --> N8949
  N8950[logQueryStats()]:::mth
  N8947 --> N8950
  N8951[extractQueryPattern()]:::mth
  N8947 --> N8951
  N8952[suggestOptimization()]:::mth
  N8947 --> N8952
  N8953[File: security-validation.middleware.ts]:::file
  N8180 --> N8953
  N8954[Class: SecurityValidationMiddleware]:::cls
  N8953 --> N8954
  N8955[use()]:::mth
  N8954 --> N8955
  N8956[addSecurityHeaders()]:::mth
  N8954 --> N8956
  N8957[sanitizeRequestData()]:::mth
  N8954 --> N8957
  N8958[sanitizeObject()]:::mth
  N8954 --> N8958
  N8959[sanitizeString()]:::mth
  N8954 --> N8959
  N8961[File: validation.ts]:::file
  N8180 --> N8961
  N8962[Class: ValidationError]:::cls
  N8961 --> N8962
  N8964[File: ClaudeDevAutomationModule.ts]:::file
  N8180 --> N8964
  N8965[Class: ClaudeDevAutomationModule]:::cls
  N8964 --> N8965
  N8966[File: access-bootstrap.service.ts]:::file
  N8180 --> N8966
  N8967[Class: AccessBootstrapService]:::cls
  N8966 --> N8967
  N8968[onModuleInit()]:::mth
  N8967 --> N8968
  N8969[seedDefaultPokerRules()]:::mth
  N8967 --> N8969
  N8970[Number()]:::mth
  N8967 --> N8970
  N8971[String()]:::mth
  N8967 --> N8971
  N8972[clean()]:::mth
  N8967 --> N8972
  N8973[File: access.controller.ts]:::file
  N8180 --> N8973
  N8974[Class: AccessController]:::cls
  N8973 --> N8974
  N8975[File: access.module.ts]:::file
  N8180 --> N8975
  N8976[Class: AccessModule]:::cls
  N8975 --> N8976
  N8977[File: access.service.ts]:::file
  N8180 --> N8977
  N8978[Class: AccessService]:::cls
  N8977 --> N8978
  N8979[resolve()]:::mth
  N8978 --> N8979
  N8980[normalizeInput()]:::mth
  N8978 --> N8980
  N8981[findUserByEmail()]:::mth
  N8978 --> N8981
  N8982[getAgent()]:::mth
  N8978 --> N8982
  N8983[validateInvite()]:::mth
  N8978 --> N8983
  N8984[File: admin.module.ts]:::file
  N8180 --> N8984
  N8985[Class: AdminModule]:::cls
  N8984 --> N8985
  N8987[File: chronological-processes.service.ts]:::file
  N8180 --> N8987
  N8988[Class: ChronologicalProcessesService]:::cls
  N8987 --> N8988
  N8989[listProcesses()]:::mth
  N8988 --> N8989
  N8990[updateProcess()]:::mth
  N8988 --> N8990
  N8991[runProcessNow()]:::mth
  N8988 --> N8991
  N8992[getProcessHistory()]:::mth
  N8988 --> N8992
  N8993[getProcessById()]:::mth
  N8988 --> N8993
  N8994[File: agency-hub.module.ts]:::file
  N8180 --> N8994
  N8995[Class: AgencyHubModule]:::cls
  N8994 --> N8995
  N8997[File: aggregate.service.ts]:::file
  N8180 --> N8997
  N8998[Class: AggregateService]:::cls
  N8997 --> N8998
  N8999[aggregateResponses()]:::mth
  N8998 --> N8999
  N9000[findConsensus()]:::mth
  N8998 --> N9000
  N9001[combineDataSources()]:::mth
  N8998 --> N9001
  N9002[synthesizeInformation()]:::mth
  N8998 --> N9002
  N9003[File: debate.service.ts]:::file
  N8180 --> N9003
  N9004[Class: DebateService]:::cls
  N9003 --> N9004
  N9005[initializeDebate()]:::mth
  N9004 --> N9005
  N9006[submitPosition()]:::mth
  N9004 --> N9006
  N9007[evaluateDebate()]:::mth
  N9004 --> N9007
  N9008[simpleEvaluation()]:::mth
  N9004 --> N9008
  N9009[facilitateMultiRoundDebate()]:::mth
  N9004 --> N9009
  N9011[File: reflect.service.ts]:::file
  N8180 --> N9011
  N9012[Class: ReflectService]:::cls
  N9011 --> N9012
  N9013[reflectOnPerformance()]:::mth
  N9012 --> N9013
  N9014[analyzeDecisionPatterns()]:::mth
  N9012 --> N9014
  N9015[generateSelfAssessment()]:::mth
  N9012 --> N9015
  N9016[File: a2a-auth-broker.controller.ts]:::file
  N8180 --> N9016
  N9017[Class: A2AAuthBrokerController]:::cls
  N9016 --> N9017
  N9018[assertCanApprove()]:::mth
  N9017 --> N9018
  N9019[assertCanManageRevocation()]:::mth
  N9017 --> N9019
  N9020[assertCanManagePolicies()]:::mth
  N9017 --> N9020
  N9021[getClientIp()]:::mth
  N9017 --> N9021
  N9022[File: a2a-broker.controller.ts]:::file
  N8180 --> N9022
  N9023[Class: A2AMessageBrokerController]:::cls
  N9022 --> N9023
  N9024[getOnlineAgents()]:::mth
  N9023 --> N9024
  N9025[getStatus()]:::mth
  N9023 --> N9025
  N9026[getMetrics()]:::mth
  N9023 --> N9026
  N9027[File: agency.controller.ts]:::file
  N8180 --> N9027
  N9028[Class: AgencyServiceLocal]:::cls
  N9027 --> N9028
  N9029[createAgency()]:::mth
  N9028 --> N9029
  N9030[getAgency()]:::mth
  N9028 --> N9030
  N9031[getAgencyBySlug()]:::mth
  N9028 --> N9031
  N9032[updateAgency()]:::mth
  N9028 --> N9032
  N9033[deleteAgency()]:::mth
  N9028 --> N9033
  N9034[Class: CreateAgencyApiDto]:::cls
  N9027 --> N9034
  N9035[createAgency()]:::mth
  N9034 --> N9035
  N9036[getAgency()]:::mth
  N9034 --> N9036
  N9037[getAgencyBySlug()]:::mth
  N9034 --> N9037
  N9038[updateAgency()]:::mth
  N9034 --> N9038
  N9039[deleteAgency()]:::mth
  N9034 --> N9039
  N9040[Class: UpdateAgencyApiDto]:::cls
  N9027 --> N9040
  N9041[createAgency()]:::mth
  N9040 --> N9041
  N9042[getAgency()]:::mth
  N9040 --> N9042
  N9043[getAgencyBySlug()]:::mth
  N9040 --> N9043
  N9044[updateAgency()]:::mth
  N9040 --> N9044
  N9045[deleteAgency()]:::mth
  N9040 --> N9045
  N9046[Class: InitializeSwarmDto]:::cls
  N9027 --> N9046
  N9047[createAgency()]:::mth
  N9046 --> N9047
  N9048[getAgency()]:::mth
  N9046 --> N9048
  N9049[getAgencyBySlug()]:::mth
  N9046 --> N9049
  N9050[updateAgency()]:::mth
  N9046 --> N9050
  N9051[deleteAgency()]:::mth
  N9046 --> N9051
  N9052[Class: RegisterProvidersDto]:::cls
  N9027 --> N9052
  N9053[createAgency()]:::mth
  N9052 --> N9053
  N9054[getAgency()]:::mth
  N9052 --> N9054
  N9055[getAgencyBySlug()]:::mth
  N9052 --> N9055
  N9056[updateAgency()]:::mth
  N9052 --> N9056
  N9057[deleteAgency()]:::mth
  N9052 --> N9057
  N9058[Class: AgencyController]:::cls
  N9027 --> N9058
  N9059[createAgency()]:::mth
  N9058 --> N9059
  N9060[getAgency()]:::mth
  N9058 --> N9060
  N9061[getAgencyBySlug()]:::mth
  N9058 --> N9061
  N9062[updateAgency()]:::mth
  N9058 --> N9062
  N9063[deleteAgency()]:::mth
  N9058 --> N9063
  N9064[File: analytics.controller.ts]:::file
  N8180 --> N9064
  N9065[Class: AnalyticsController]:::cls
  N9064 --> N9065
  N9066[notImplemented()]:::mth
  N9065 --> N9066
  N9067[File: email-custodian.controller.ts]:::file
  N8180 --> N9067
  N9068[Class: EmailCustodianController]:::cls
  N9067 --> N9068
  N9069[requireUserId()]:::mth
  N9068 --> N9069
  N9070[assertCanManage()]:::mth
  N9068 --> N9070
  N9071[File: service-request.controller.ts]:::file
  N8180 --> N9071
  N9072[Class: ServiceRequestController]:::cls
  N9071 --> N9072
  N9073[notImplemented()]:::mth
  N9072 --> N9073
  N9074[File: swarm.controller.ts]:::file
  N8180 --> N9074
  N9075[Class: SwarmController]:::cls
  N9074 --> N9075
  N9076[getSwarmCapabilityStatus()]:::mth
  N9075 --> N9076
  N9077[notImplemented()]:::mth
  N9075 --> N9077
  N9078[File: a2a-auth-broker.dto.ts]:::file
  N8180 --> N9078
  N9079[Class: RequestAgentTokenDto]:::cls
  N9078 --> N9079
  N9080[Class: ApproveAgentTokenRequestDto]:::cls
  N9078 --> N9080
  N9081[Class: RevokeAgentTokenDto]:::cls
  N9078 --> N9081
  N9082[Class: RevokeAllAgentTokensDto]:::cls
  N9078 --> N9082
  N9083[Class: UpsertAuthBrokerPolicyDto]:::cls
  N9078 --> N9083
  N9084[Class: AuthorizeAgentTokenDto]:::cls
  N9078 --> N9084
  N9086[File: a2a-auth-broker.service.ts]:::file
  N8180 --> N9086
  N9087[Class: A2AAuthBrokerService]:::cls
  N9086 --> N9087
  N9088[onModuleInit()]:::mth
  N9087 --> N9088
  N9089[onModuleDestroy()]:::mth
  N9087 --> N9089
  N9090[requestToken()]:::mth
  N9087 --> N9090
  N9091[approveTokenRequest()]:::mth
  N9087 --> N9091
  N9092[revokeTokenOrRequest()]:::mth
  N9087 --> N9092
  N9093[File: a2a-message-broker.service.ts]:::file
  N8180 --> N9093
  N9094[Class: A2AMessageBrokerService]:::cls
  N9093 --> N9094
  N9095[onModuleInit()]:::mth
  N9094 --> N9095
  N9096[onModuleDestroy()]:::mth
  N9094 --> N9096
  N9097[sendMessage()]:::mth
  N9094 --> N9097
  N9098[deliverDirectMessage()]:::mth
  N9094 --> N9098
  N9099[broadcastMessage()]:::mth
  N9094 --> N9099
  N9100[File: agent-swarm-orchestration.service.ts]:::file
  N8180 --> N9100
  N9101[Class: AgentSwarmOrchestrationService]:::cls
  N9100 --> N9101
  N9102[initializeSwarm()]:::mth
  N9101 --> N9102
  N9103[getGlobalSwarmStatus()]:::mth
  N9101 --> N9103
  N9104[initializeAgencySwarm()]:::mth
  N9101 --> N9104
  N9105[disableAgencySwarm()]:::mth
  N9101 --> N9105
  N9106[registerAgent()]:::mth
  N9101 --> N9106
  N9108[File: email-custodian.service.ts]:::file
  N8180 --> N9108
  N9109[Class: EmailCustodianService]:::cls
  N9108 --> N9109
  N9110[listAccountsForOwner()]:::mth
  N9109 --> N9110
  N9111[provisionAccountForOwner()]:::mth
  N9109 --> N9111
  N9112[createGrantForAccount()]:::mth
  N9109 --> N9112
  N9113[listAccountGrants()]:::mth
  N9109 --> N9113
  N9114[revokeGrant()]:::mth
  N9109 --> N9114
  N9117[File: agent-tracking.service.ts]:::file
  N8180 --> N9117
  N9118[Class: DefaultAbuseChecker]:::cls
  N9117 --> N9118
  N9119[check()]:::mth
  N9118 --> N9119
  N9120[check()]:::mth
  N9118 --> N9120
  N9121[recordAgent()]:::mth
  N9118 --> N9121
  N9122[findTrackingByAgentId()]:::mth
  N9118 --> N9122
  N9123[findTrackingByIpAddress()]:::mth
  N9118 --> N9123
  N9124[Class: AgentTrackingService]:::cls
  N9117 --> N9124
  N9125[check()]:::mth
  N9124 --> N9125
  N9126[check()]:::mth
  N9124 --> N9126
  N9127[recordAgent()]:::mth
  N9124 --> N9127
  N9128[findTrackingByAgentId()]:::mth
  N9124 --> N9128
  N9129[findTrackingByIpAddress()]:::mth
  N9124 --> N9129
  N9130[File: agent.module.ts]:::file
  N8180 --> N9130
  N9131[Class: AgentModule]:::cls
  N9130 --> N9131
  N9132[File: goose.controller.ts]:::file
  N8180 --> N9132
  N9133[Class: GooseController]:::cls
  N9132 --> N9133
  N9134[File: goose.dto.ts]:::file
  N8180 --> N9134
  N9135[Class: GooseDispatchDto]:::cls
  N9134 --> N9135
  N9136[File: goose.module.ts]:::file
  N8180 --> N9136
  N9137[Class: GooseModule]:::cls
  N9136 --> N9137
  N9138[File: goose.service.ts]:::file
  N8180 --> N9138
  N9139[Class: GooseService]:::cls
  N9138 --> N9139
  N9140[getAccess()]:::mth
  N9139 --> N9140
  N9141[dispatch()]:::mth
  N9139 --> N9141
  N9142[resolveRelayLogLevel()]:::mth
  N9139 --> N9142
  N9143[resolveAccess()]:::mth
  N9139 --> N9143
  N9144[resolveCwd()]:::mth
  N9139 --> N9144
  N9145[File: auth.module.ts]:::file
  N8180 --> N9145
  N9146[Class: AuthModule]:::cls
  N9145 --> N9146
  N9147[File: billing.controller.ts]:::file
  N8180 --> N9147
  N9148[Class: BillingController]:::cls
  N9147 --> N9148
  N9149[File: billing.module.ts]:::file
  N8180 --> N9149
  N9150[Class: BillingModule]:::cls
  N9149 --> N9150
  N9151[File: paypal.controller.ts]:::file
  N8180 --> N9151
  N9152[Class: PayPalController]:::cls
  N9151 --> N9152
  N9153[verifyPayPalWebhookSignature()]:::mth
  N9152 --> N9153
  N9154[extractPublicKeyFromCert()]:::mth
  N9152 --> N9154
  N9155[isTrustedPayPalCertUrl()]:::mth
  N9152 --> N9155
  N9156[File: paypal.service.ts]:::file
  N8180 --> N9156
  N9157[Class: PayPalService]:::cls
  N9156 --> N9157
  N9158[getAccessToken()]:::mth
  N9157 --> N9158
  N9159[handleWebhook()]:::mth
  N9157 --> N9159
  N9160[createSubscriptionRecord()]:::mth
  N9157 --> N9160
  N9161[updateSubscriptionStatus()]:::mth
  N9157 --> N9161
  N9162[getUserTier()]:::mth
  N9157 --> N9162
  N9163[File: stripe.controller.ts]:::file
  N8180 --> N9163
  N9164[Class: StripeController]:::cls
  N9163 --> N9164
  N9165[String()]:::mth
  N9164 --> N9165
  N9166[verifyStripeSignature()]:::mth
  N9164 --> N9166
  N9167[File: stripe.service.ts]:::file
  N8180 --> N9167
  N9168[Class: StripeService]:::cls
  N9167 --> N9168
  N9169[recordSubscription()]:::mth
  N9168 --> N9169
  N9170[updateSubscriptionByStripeId()]:::mth
  N9168 --> N9170
  N9171[handleWebhookEvent()]:::mth
  N9168 --> N9171
  N9172[String()]:::mth
  N9168 --> N9172
  N9173[createCheckoutSession()]:::mth
  N9168 --> N9173
  N9174[File: chat.controller.ts]:::file
  N8180 --> N9174
  N9175[Class: ChatController]:::cls
  N9174 --> N9175
  N9176[requireUserId()]:::mth
  N9175 --> N9176
  N9177[Number()]:::mth
  N9175 --> N9177
  N9178[File: chat.module.ts]:::file
  N8180 --> N9178
  N9179[Class: ChatModule]:::cls
  N9178 --> N9179
  N9180[File: chat.service.ts]:::file
  N8180 --> N9180
  N9181[Class: ChatService]:::cls
  N9180 --> N9181
  N9182[findAll()]:::mth
  N9181 --> N9182
  N9183[findOne()]:::mth
  N9181 --> N9183
  N9184[create()]:::mth
  N9181 --> N9184
  N9185[addMessage()]:::mth
  N9181 --> N9185
  N9186[getMessages()]:::mth
  N9181 --> N9186
  N9187[File: agent-swarm.service.ts]:::file
  N8180 --> N9187
  N9188[Class: AgentSwarmService]:::cls
  N9187 --> N9188
  N9189[onModuleInit()]:::mth
  N9188 --> N9189
  N9190[onModuleDestroy()]:::mth
  N9188 --> N9190
  N9191[registerAgent()]:::mth
  N9188 --> N9191
  N9192[unregisterAgent()]:::mth
  N9188 --> N9192
  N9193[recordHeartbeat()]:::mth
  N9188 --> N9193
  N9194[File: bmad.service.ts]:::file
  N8180 --> N9194
  N9195[Class: BMADService]:::cls
  N9194 --> N9195
  N9196[onModuleInit()]:::mth
  N9195 --> N9196
  N9197[initializeDefaultSkills()]:::mth
  N9195 --> N9197
  N9198[registerSkill()]:::mth
  N9195 --> N9198
  N9199[createToolFromSkill()]:::mth
  N9195 --> N9199
  N9200[executeBMADCycle()]:::mth
  N9195 --> N9200
  N9201[File: director.module.ts]:::file
  N8180 --> N9201
  N9202[Class: DirectorModule]:::cls
  N9201 --> N9202
  N9203[File: director.service.ts]:::file
  N8180 --> N9203
  N9204[Class: DirectorService]:::cls
  N9203 --> N9204
  N9205[onModuleInit()]:::mth
  N9204 --> N9205
  N9206[onModuleDestroy()]:::mth
  N9204 --> N9206
  N9207[start()]:::mth
  N9204 --> N9207
  N9208[stop()]:::mth
  N9204 --> N9208
  N9209[executeCycle()]:::mth
  N9204 --> N9209
  N9210[File: entity-discovery.module.ts]:::file
  N8180 --> N9210
  N9211[Class: EntityDiscoveryModule]:::cls
  N9210 --> N9211
  N9212[File: export.module.ts]:::file
  N8180 --> N9212
  N9213[Class: ExportModule]:::cls
  N9212 --> N9213
  N9214[File: marketplace.controller.ts]:::file
  N8180 --> N9214
  N9215[Class: MarketplaceController]:::cls
  N9214 --> N9215
  N9216[getResearchCounts()]:::mth
  N9215 --> N9216
  N9217[getResearchSkillCounts()]:::mth
  N9215 --> N9217
  N9218[getResearchSkillMarketplaceCounts()]:::mth
  N9215 --> N9218
  N9219[getResearchMcpCounts()]:::mth
  N9215 --> N9219
  N9220[submitForMemberOrAdmin()]:::mth
  N9215 --> N9220
  N9221[File: marketplace.member-policy.integration.spec.ts]:::file
  N8180 --> N9221
  N9222[Class: MockJwtGuard]:::cls
  N9221 --> N9222
  N9223[canActivate()]:::mth
  N9222 --> N9223
  N9224[Class: TestHttpExceptionFilter]:::cls
  N9221 --> N9224
  N9225[canActivate()]:::mth
  N9224 --> N9225
  N9226[File: marketplace.module.ts]:::file
  N8180 --> N9226
  N9227[Class: MarketplaceModule]:::cls
  N9226 --> N9227
  N9228[File: marketplace.service.ts]:::file
  N8180 --> N9228
  N9229[Class: MarketplaceService]:::cls
  N9228 --> N9229
  N9230[onModuleInit()]:::mth
  N9229 --> N9230
  N9231[onModuleDestroy()]:::mth
  N9229 --> N9231
  N9232[getCatalog()]:::mth
  N9229 --> N9232
  N9233[getExperiences()]:::mth
  N9229 --> N9233
  N9234[getResearchCounts()]:::mth
  N9229 --> N9234
  N9236[File: news-feed.controller.ts]:::file
  N8180 --> N9236
  N9237[Class: NewsFeedController]:::cls
  N9236 --> N9237
  N9238[File: prompt-templates.module.ts]:::file
  N8180 --> N9238
  N9239[Class: PromptTemplatesModule]:::cls
  N9238 --> N9239
  N9240[File: personal-skill.dto.ts]:::file
  N8180 --> N9240
  N9241[Class: PersonalSkillDto]:::cls
  N9240 --> N9241
  N9242[Class: CreatePersonalSkillDto]:::cls
  N9240 --> N9242
  N9243[Class: UpdatePersonalSkillDto]:::cls
  N9240 --> N9243
  N9244[File: resource-search-protocol.dto.ts]:::file
  N8180 --> N9244
  N9245[Class: ResourceSearchProtocolActorDto]:::cls
  N9244 --> N9245
  N9246[Class: ResourceSearchProtocolTraceDto]:::cls
  N9244 --> N9246
  N9247[Class: ResourceSearchProtocolRequestEnvelopeDto]:::cls
  N9244 --> N9247
  N9248[Class: ResourceSearchProtocolResponseEnvelopeDto]:::cls
  N9244 --> N9248
  N9249[File: resource-search.dto.ts]:::file
  N8180 --> N9249
  N9250[Class: ResourceSearchRequestDto]:::cls
  N9249 --> N9250
  N9251[Class: ResourceSearchMetaDto]:::cls
  N9249 --> N9251
  N9252[Class: ResourceDto]:::cls
  N9249 --> N9252
  N9253[Class: ResourceSearchEnvelopeDto]:::cls
  N9249 --> N9253
  N9254[File: personal-skills.service.ts]:::file
  N8180 --> N9254
  N9255[Class: PersonalSkillsService]:::cls
  N9254 --> N9255
  N9256[listByUser()]:::mth
  N9255 --> N9256
  N9257[getByUser()]:::mth
  N9255 --> N9257
  N9258[createByUser()]:::mth
  N9255 --> N9258
  N9259[Boolean()]:::mth
  N9255 --> N9259
  N9260[updateByUser()]:::mth
  N9255 --> N9260
  N9262[File: resource-interaction.service.ts]:::file
  N8180 --> N9262
  N9263[Class: ResourceInteractionService]:::cls
  N9262 --> N9263
  N9264[toggleFavorite()]:::mth
  N9263 --> N9264
  N9265[shareResource()]:::mth
  N9263 --> N9265
  N9267[File: resource-registry-api-key.guard.ts]:::file
  N8180 --> N9267
  N9268[Class: ResourceRegistryApiKeyGuard]:::cls
  N9267 --> N9268
  N9269[canActivate()]:::mth
  N9268 --> N9269
  N9270[readConfigValues()]:::mth
  N9268 --> N9270
  N9271[normalizeHeader()]:::mth
  N9268 --> N9271
  N9273[File: resource-search-policy.service.ts]:::file
  N8180 --> N9273
  N9274[Class: ResourceSearchPolicyService]:::cls
  N9273 --> N9274
  N9275[parseSortBy()]:::mth
  N9274 --> N9275
  N9276[normalizeTerm()]:::mth
  N9274 --> N9276
  N9277[toUniqueTerms()]:::mth
  N9274 --> N9277
  N9278[isTraitScreenEnabled()]:::mth
  N9274 --> N9278
  N9279[getTraitScreenUrls()]:::mth
  N9274 --> N9279
  N9281[File: resource-search-protocol.service.ts]:::file
  N8180 --> N9281
  N9282[Class: ResourceSearchProtocolService]:::cls
  N9281 --> N9282
  N9283[decodeRequest()]:::mth
  N9282 --> N9283
  N9284[normalizeFilter()]:::mth
  N9282 --> N9284
  N9285[isProtocolRequestEnvelope()]:::mth
  N9282 --> N9285
  N9286[looksLikeProtocolEnvelope()]:::mth
  N9282 --> N9286
  N9287[assertValidRequestEnvelope()]:::mth
  N9282 --> N9287
  N9289[File: resources.controller.ts]:::file
  N8180 --> N9289
  N9290[Class: ResourcesController]:::cls
  N9289 --> N9290
  N9291[resolveUserId()]:::mth
  N9290 --> N9291
  N9292[mapCategory()]:::mth
  N9290 --> N9292
  N9293[toBaseResource()]:::mth
  N9290 --> N9293
  N9294[toSkill()]:::mth
  N9290 --> N9294
  N9295[toWorkflow()]:::mth
  N9290 --> N9295
  N9296[File: resources.module.ts]:::file
  N8180 --> N9296
  N9297[Class: ResourcesModule]:::cls
  N9296 --> N9297
  N9298[File: security.module.ts]:::file
  N8180 --> N9298
  N9299[Class: SecurityModule]:::cls
  N9298 --> N9299
  N9300[File: task.dto.ts]:::file
  N8180 --> N9300
  N9301[Class: ListTasksQueryDto]:::cls
  N9300 --> N9301
  N9302[Class: CreateTaskDto]:::cls
  N9300 --> N9302
  N9303[Class: UpdateTaskStatusDto]:::cls
  N9300 --> N9303
  N9304[Class: CreateTaskExecutionLogDto]:::cls
  N9300 --> N9304
  N9305[File: task-health-monitor.service.ts]:::file
  N8180 --> N9305
  N9306[Class: TaskHealthMonitorService]:::cls
  N9305 --> N9306
  N9307[onModuleInit()]:::mth
  N9306 --> N9307
  N9308[onModuleDestroy()]:::mth
  N9306 --> N9308
  N9309[scanForStuckTasks()]:::mth
  N9306 --> N9309
  N9310[getIntervalMs()]:::mth
  N9306 --> N9310
  N9312[File: task.controller.ts]:::file
  N8180 --> N9312
  N9313[Class: TaskController]:::cls
  N9312 --> N9313
  N9314[requireUserId()]:::mth
  N9313 --> N9314
  N9315[File: task.module.ts]:::file
  N8180 --> N9315
  N9316[Class: TaskModule]:::cls
  N9315 --> N9316
  N9318[File: task.service.ts]:::file
  N8180 --> N9318
  N9319[Class: TaskService]:::cls
  N9318 --> N9319
  N9320[findStuckTasks()]:::mth
  N9319 --> N9320
  N9321[findStuckTasksUnscoped()]:::mth
  N9319 --> N9321
  N9322[findActiveTasks()]:::mth
  N9319 --> N9322
  N9323[updateTask()]:::mth
  N9319 --> N9323
  N9324[getTaskById()]:::mth
  N9319 --> N9324
  N9326[File: terminal-graph-query.dto.ts]:::file
  N8180 --> N9326
  N9327[Class: TerminalGraphQueryDto]:::cls
  N9326 --> N9327
  N9329[File: terminals.controller.ts]:::file
  N8180 --> N9329
  N9330[Class: TerminalsController]:::cls
  N9329 --> N9330
  N9331[File: terminals.module.ts]:::file
  N8180 --> N9331
  N9332[Class: TerminalsModule]:::cls
  N9331 --> N9332
  N9334[File: terminals.service.ts]:::file
  N8180 --> N9334
  N9335[Class: TerminalsService]:::cls
  N9334 --> N9335
  N9336[getTerminalGraph()]:::mth
  N9335 --> N9336
  N9337[loadInventorySnapshot()]:::mth
  N9335 --> N9337
  N9338[loadRegistryAgentIds()]:::mth
  N9335 --> N9338
  N9339[emptyGraph()]:::mth
  N9335 --> N9339
  N9340[buildGraph()]:::mth
  N9335 --> N9340
  N9341[File: tnf-autonomous.module.ts]:::file
  N8180 --> N9341
  N9342[Class: TNFAutonomousModule]:::cls
  N9341 --> N9342
  N9343[onModuleInit()]:::mth
  N9342 --> N9343
  N9344[getSystemStatus()]:::mth
  N9342 --> N9344
  N9346[File: unified-ledger.controller.ts]:::file
  N8180 --> N9346
  N9347[Class: UnifiedLedgerController]:::cls
  N9346 --> N9347
  N9348[requireUserId()]:::mth
  N9347 --> N9348
  N9349[File: unified-ledger.module.ts]:::file
  N8180 --> N9349
  N9350[Class: UnifiedLedgerModule]:::cls
  N9349 --> N9350
  N9352[File: unified-ledger.service.ts]:::file
  N8180 --> N9352
  N9353[Class: UnifiedLedgerService]:::cls
  N9352 --> N9353
  N9354[onModuleInit()]:::mth
  N9353 --> N9354
  N9355[listRecords()]:::mth
  N9353 --> N9355
  N9356[getRecord()]:::mth
  N9353 --> N9356
  N9357[createRecord()]:::mth
  N9353 --> N9357
  N9358[updateRecord()]:::mth
  N9353 --> N9358
  N9360[File: business-event.service.ts]:::file
  N8180 --> N9360
  N9361[Class: BusinessEventService]:::cls
  N9360 --> N9361
  N9362[createEvent()]:::mth
  N9361 --> N9362
  N9363[processEvent()]:::mth
  N9361 --> N9363
  N9364[processEventByType()]:::mth
  N9361 --> N9364
  N9365[processLeadCreated()]:::mth
  N9361 --> N9365
  N9366[processPaymentReceived()]:::mth
  N9361 --> N9366
  N9367[File: integration.service.ts]:::file
  N8180 --> N9367
  N9368[Class: IntegrationService]:::cls
  N9367 --> N9368
  N9369[transformToBusinessEvent()]:::mth
  N9368 --> N9369
  N9370[transformStripeEvent()]:::mth
  N9368 --> N9370
  N9371[transformPayPalEvent()]:::mth
  N9368 --> N9371
  N9372[transformSalesforceEvent()]:::mth
  N9368 --> N9372
  N9373[transformHubSpotEvent()]:::mth
  N9368 --> N9373
  N9374[File: sse.service.ts]:::file
  N8180 --> N9374
  N9375[Class: SSEService]:::cls
  N9374 --> N9375
  N9376[addClient()]:::mth
  N9375 --> N9376
  N9377[removeClient()]:::mth
  N9375 --> N9377
  N9378[broadcastEvent()]:::mth
  N9375 --> N9378
  N9379[sendToClient()]:::mth
  N9375 --> N9379
  N9380[sendHeartbeat()]:::mth
  N9375 --> N9380
  N9381[File: webhook-security.service.ts]:::file
  N8180 --> N9381
  N9382[Class: WebhookSecurityService]:::cls
  N9381 --> N9382
  N9383[validateSignature()]:::mth
  N9382 --> N9383
  N9384[generateSignature()]:::mth
  N9382 --> N9384
  N9385[normalizeSignature()]:::mth
  N9382 --> N9385
  N9386[timingSafeEqual()]:::mth
  N9382 --> N9386
  N9387[validateStripeSignature()]:::mth
  N9382 --> N9387
  N9388[File: webhooks.controller.ts]:::file
  N8180 --> N9388
  N9389[Class: WebhooksController]:::cls
  N9388 --> N9389
  N9390[extractSignature()]:::mth
  N9389 --> N9390
  N9391[File: webhooks.module.ts]:::file
  N8180 --> N9391
  N9392[Class: WebhooksModule]:::cls
  N9391 --> N9392
  N9393[File: webhooks.service.ts]:::file
  N8180 --> N9393
  N9394[Class: WebhooksService]:::cls
  N9393 --> N9394
  N9395[registerWebhook()]:::mth
  N9394 --> N9395
  N9396[handleWebhook()]:::mth
  N9394 --> N9396
  N9397[getWebhookStatus()]:::mth
  N9394 --> N9397
  N9398[getSignatureHeader()]:::mth
  N9394 --> N9398
  N9399[deactivateWebhook()]:::mth
  N9394 --> N9399
  N9400[File: cloudflare-deployment.service.ts]:::file
  N8180 --> N9400
  N9401[Class: CloudflareDeploymentService]:::cls
  N9400 --> N9401
  N9402[deployWorkflow()]:::mth
  N9401 --> N9402
  N9403[sanitizeName()]:::mth
  N9401 --> N9403
  N9404[sanitizeClassName()]:::mth
  N9401 --> N9404
  N9405[File: workflow-deployment.controller.ts]:::file
  N8180 --> N9405
  N9406[Class: WorkflowDeploymentController]:::cls
  N9405 --> N9406
  N9407[File: workflow-deployment.module.ts]:::file
  N8180 --> N9407
  N9408[Class: WorkflowDeploymentModule]:::cls
  N9407 --> N9408
  N9409[File: workflow-templates.module.ts]:::file
  N8180 --> N9409
  N9410[Class: WorkflowTemplatesModule]:::cls
  N9409 --> N9410
  N9411[File: monitoring.controller.ts]:::file
  N8180 --> N9411
  N9412[Class: MonitoringController]:::cls
  N9411 --> N9412
  N9413[getSystemHealth()]:::mth
  N9412 --> N9413
  N9414[getRecentAlerts()]:::mth
  N9412 --> N9414
  N9415[File: monitoring.module.ts]:::file
  N8180 --> N9415
  N9416[Class: MonitoringModule]:::cls
  N9415 --> N9416
  N9417[File: wallet-monitoring.service.ts]:::file
  N8180 --> N9417
  N9418[Class: WalletMonitoringService]:::cls
  N9417 --> N9418
  N9419[createAlert()]:::mth
  N9418 --> N9419
  N9420[monitorSystemHealth()]:::mth
  N9418 --> N9420
  N9421[monitorAgentActivity()]:::mth
  N9418 --> N9421
  N9422[monitorTransactionStatus()]:::mth
  N9418 --> N9422
  N9423[getSystemHealth()]:::mth
  N9418 --> N9423
  N9424[File: workflow-stubs.provider.ts]:::file
  N8180 --> N9424
  N9425[Class: WorkflowEngineStub]:::cls
  N9424 --> N9425
  N9426[fail()]:::mth
  N9425 --> N9426
  N9427[createWorkflow()]:::mth
  N9425 --> N9427
  N9428[getWorkflow()]:::mth
  N9425 --> N9428
  N9429[updateWorkflow()]:::mth
  N9425 --> N9429
  N9430[deleteWorkflow()]:::mth
  N9425 --> N9430
  N9431[Class: WorkflowExecutorStub]:::cls
  N9424 --> N9431
  N9432[fail()]:::mth
  N9431 --> N9432
  N9433[createWorkflow()]:::mth
  N9431 --> N9433
  N9434[getWorkflow()]:::mth
  N9431 --> N9434
  N9435[updateWorkflow()]:::mth
  N9431 --> N9435
  N9436[deleteWorkflow()]:::mth
  N9431 --> N9436
  N9442[File: claude-dev-cli.ts]:::file
  N8180 --> N9442
  N9443[Class: ClaudeDevCLI]:::cls
  N9442 --> N9443
  N9444[loadConfig()]:::mth
  N9443 --> N9444
  N9445[saveConfig()]:::mth
  N9443 --> N9445
  N9446[makeRequest()]:::mth
  N9443 --> N9446
  N9447[displayAutomationResult()]:::mth
  N9443 --> N9447
  N9448[listTemplates()]:::mth
  N9443 --> N9448
  N9454[File: api-endpoint-monitoring.service.ts]:::file
  N8180 --> N9454
  N9455[Class: ApiEndpointMonitoringService]:::cls
  N9454 --> N9455
  N9456[onModuleInit()]:::mth
  N9455 --> N9456
  N9457[recordRequest()]:::mth
  N9455 --> N9457
  N9458[recordAuthFailure()]:::mth
  N9455 --> N9458
  N9459[recordAuthZFailure()]:::mth
  N9455 --> N9459
  N9460[recordRateLimitViolation()]:::mth
  N9455 --> N9460
  N9461[File: enhanced-rate-limit.service.ts]:::file
  N8180 --> N9461
  N9462[Class: EnhancedRateLimitService]:::cls
  N9461 --> N9462
  N9463[checkRateLimit()]:::mth
  N9462 --> N9463
  N9464[checkRateLimitAuto()]:::mth
  N9462 --> N9464
  N9465[blockIP()]:::mth
  N9462 --> N9465
  N9466[isIPBlocked()]:::mth
  N9462 --> N9466
  N9467[getRateLimitStatus()]:::mth
  N9462 --> N9467
  N9468[File: input-sanitization.service.ts]:::file
  N8180 --> N9468
  N9469[Class: InputSanitizationService]:::cls
  N9468 --> N9469
  N9470[sanitizeHTML()]:::mth
  N9469 --> N9470
  N9471[sanitizeText()]:::mth
  N9469 --> N9471
  N9472[sanitizeForDatabase()]:::mth
  N9469 --> N9472
  N9473[sanitizeFileName()]:::mth
  N9469 --> N9473
  N9474[sanitizeUrl()]:::mth
  N9469 --> N9474
  N9475[File: response-sanitization.service.ts]:::file
  N8180 --> N9475
  N9476[Class: ResponseSanitizationService]:::cls
  N9475 --> N9476
  N9477[sanitizeError()]:::mth
  N9476 --> N9477
  N9478[sanitizeLogData()]:::mth
  N9476 --> N9478
  N9479[sanitizeObject()]:::mth
  N9476 --> N9479
  N9480[sanitizeString()]:::mth
  N9476 --> N9480
  N9481[maskValue()]:::mth
  N9476 --> N9481
  N9482[File: security-integration.service.ts]:::file
  N8180 --> N9482
  N9483[Class: SecurityIntegrationService]:::cls
  N9482 --> N9483
  N9484[performSecurityCheck()]:::mth
  N9483 --> N9484
  N9485[validateJWT()]:::mth
  N9483 --> N9485
  N9486[checkAuthorizationLevel()]:::mth
  N9483 --> N9486
  N9487[getClientIP()]:::mth
  N9483 --> N9487
  N9488[performSecurityAnalysis()]:::mth
  N9483 --> N9488
  N9489[File: security-logging.service.ts]:::file
  N8180 --> N9489
  N9490[Class: SecurityLoggingService]:::cls
  N9489 --> N9490
  N9491[logAuthEvent()]:::mth
  N9490 --> N9491
  N9492[logAuthZEvent()]:::mth
  N9490 --> N9492
  N9493[logRateLimit()]:::mth
  N9490 --> N9493
  N9494[logInputValidation()]:::mth
  N9490 --> N9494
  N9495[logApiAccess()]:::mth
  N9490 --> N9495
  N9496[File: security-testing.service.ts]:::file
  N8180 --> N9496
  N9497[Class: SecurityTestingService]:::cls
  N9496 --> N9497
  N9498[runAllSecurityTests()]:::mth
  N9497 --> N9498
  N9499[testXSSProtection()]:::mth
  N9497 --> N9499
  N9500[testSQLInjectionPrevention()]:::mth
  N9497 --> N9500
  N9501[testInputSanitization()]:::mth
  N9497 --> N9501
  N9502[testCSRFProtection()]:::mth
  N9497 --> N9502
  N9503[File: security.module.ts]:::file
  N8180 --> N9503
  N9504[Class: SecurityModule]:::cls
  N9503 --> N9504
  N9505[File: ClaudeDevAutomationService.ts]:::file
  N8180 --> N9505
  N9506[Class: ClaudeDevAutomationService]:::cls
  N9505 --> N9506
  N9507[listTemplates()]:::mth
  N9506 --> N9507
  N9508[getTemplate()]:::mth
  N9506 --> N9508
  N9509[createCustomTemplate()]:::mth
  N9506 --> N9509
  N9510[deleteTemplate()]:::mth
  N9506 --> N9510
  N9511[executeAutomation()]:::mth
  N9506 --> N9511
  N9513[File: agent-api-grants.service.ts]:::file
  N8180 --> N9513
  N9514[Class: AgentApiGrantsService]:::cls
  N9513 --> N9514
  N9515[listForUser()]:::mth
  N9514 --> N9515
  N9516[createForUser()]:::mth
  N9514 --> N9516
  N9517[revokeForUser()]:::mth
  N9514 --> N9517
  N9518[rotateForUser()]:::mth
  N9514 --> N9518
  N9519[proxy()]:::mth
  N9514 --> N9519
  N9520[File: agent-bank.service.ts]:::file
  N8180 --> N9520
  N9521[Class: AgentBankService]:::cls
  N9520 --> N9521
  N9522[getWorkspaceRoot()]:::mth
  N9521 --> N9522
  N9523[listTemplates()]:::mth
  N9521 --> N9523
  N9524[getTemplateContent()]:::mth
  N9521 --> N9524
  N9526[File: agent-handoff.service.ts]:::file
  N8180 --> N9526
  N9527[Class: AgentHandoffService]:::cls
  N9526 --> N9527
  N9528[resolvePointers()]:::mth
  N9527 --> N9528
  N9529[resolvePointerFallback()]:::mth
  N9527 --> N9529
  N9530[publishForTenant()]:::mth
  N9527 --> N9530
  N9531[listForAgent()]:::mth
  N9527 --> N9531
  N9532[acknowledgeForTenant()]:::mth
  N9527 --> N9532
  N9533[File: agent-pfp-overrides.service.ts]:::file
  N8180 --> N9533
  N9534[Class: AgentPfpOverridesService]:::cls
  N9533 --> N9534
  N9535[getCloudAccess()]:::mth
  N9534 --> N9535
  N9536[listOverrides()]:::mth
  N9534 --> N9536
  N9537[upsertOverride()]:::mth
  N9534 --> N9537
  N9538[removeOverride()]:::mth
  N9534 --> N9538
  N9539[assertCloudWriteAccess()]:::mth
  N9534 --> N9539
  N9540[File: agent.service.ts]:::file
  N8180 --> N9540
  N9541[Class: AgentService]:::cls
  N9540 --> N9541
  N9542[agentRepository()]:::mth
  N9541 --> N9542
  N9543[createAgent()]:::mth
  N9541 --> N9543
  N9544[findAllAgents()]:::mth
  N9541 --> N9544
  N9545[findAgentById()]:::mth
  N9541 --> N9545
  N9546[updateAgent()]:::mth
  N9541 --> N9546
  N9547[File: audit.service.ts]:::file
  N8180 --> N9547
  N9548[Class: AuditService]:::cls
  N9547 --> N9548
  N9549[log()]:::mth
  N9548 --> N9549
  N9550[getLogs()]:::mth
  N9548 --> N9550
  N9551[findAll()]:::mth
  N9548 --> N9551
  N9552[findById()]:::mth
  N9548 --> N9552
  N9553[findByUserId()]:::mth
  N9548 --> N9553
  N9555[File: auth.service.ts]:::file
  N8180 --> N9555
  N9556[Class: AuthService]:::cls
  N9555 --> N9556
  N9557[supabaseExchange()]:::mth
  N9556 --> N9557
  N9558[makeUsernameUnique()]:::mth
  N9556 --> N9558
  N9559[validateToken()]:::mth
  N9556 --> N9559
  N9560[login()]:::mth
  N9556 --> N9560
  N9561[register()]:::mth
  N9556 --> N9561
  N9562[File: chat.service.ts]:::file
  N8180 --> N9562
  N9563[Class: ChatService]:::cls
  N9562 --> N9563
  N9564[getRooms()]:::mth
  N9563 --> N9564
  N9565[getRoom()]:::mth
  N9563 --> N9565
  N9566[getMessages()]:::mth
  N9563 --> N9566
  N9567[sendMessage()]:::mth
  N9563 --> N9567
  N9568[createRoom()]:::mth
  N9563 --> N9568
  N9569[File: claude-dev-templates.ts]:::file
  N8180 --> N9569
  N9570[Class: ClaudeDevTemplateRegistry]:::cls
  N9569 --> N9570
  N9571[registerTemplate()]:::mth
  N9570 --> N9571
  N9572[getTemplate()]:::mth
  N9570 --> N9572
  N9573[getAllTemplates()]:::mth
  N9570 --> N9573
  N9574[getTemplatesByCategory()]:::mth
  N9570 --> N9574
  N9575[getTemplatesByTag()]:::mth
  N9570 --> N9575
  N9576[Class: ClaudeDevTemplateUtils]:::cls
  N9569 --> N9576
  N9577[registerTemplate()]:::mth
  N9576 --> N9577
  N9578[getTemplate()]:::mth
  N9576 --> N9578
  N9579[getAllTemplates()]:::mth
  N9576 --> N9579
  N9580[getTemplatesByCategory()]:::mth
  N9576 --> N9580
  N9581[getTemplatesByTag()]:::mth
  N9576 --> N9581
  N9582[File: database.ts]:::file
  N8180 --> N9582
  N9583[Class: DatabaseService]:::cls
  N9582 --> N9583
  N9584[connect()]:::mth
  N9583 --> N9584
  N9585[disconnect()]:::mth
  N9583 --> N9585
  N9586[getConnection()]:::mth
  N9583 --> N9586
  N9587[query()]:::mth
  N9583 --> N9587
  N9588[File: metrics.service.ts]:::file
  N8180 --> N9588
  N9589[Class: MetricsService]:::cls
  N9588 --> N9589
  N9590[getMetrics()]:::mth
  N9589 --> N9590
  N9591[getSystemMetrics()]:::mth
  N9589 --> N9591
  N9592[recordMetric()]:::mth
  N9589 --> N9592
  N9593[getSystemStats()]:::mth
  N9589 --> N9593
  N9594[getCPUUsage()]:::mth
  N9589 --> N9594
  N9595[File: openclaw-oauth-rotation.service.ts]:::file
  N8180 --> N9595
  N9596[Class: OpenClawOAuthRotationService]:::cls
  N9595 --> N9596
  N9597[getEncryptionKey()]:::mth
  N9596 --> N9597
  N9598[encrypt()]:::mth
  N9596 --> N9598
  N9599[decrypt()]:::mth
  N9596 --> N9599
  N9600[makeKey()]:::mth
  N9596 --> N9600
  N9601[parseKey()]:::mth
  N9596 --> N9601
  N9602[File: openclaw-runtime.service.ts]:::file
  N8180 --> N9602
  N9603[Class: OpenClawRuntimeService]:::cls
  N9602 --> N9603
  N9604[listInstances()]:::mth
  N9603 --> N9604
  N9605[getInventory()]:::mth
  N9603 --> N9605
  N9606[getConfig()]:::mth
  N9603 --> N9606
  N9607[setConfig()]:::mth
  N9603 --> N9607
  N9608[unsetConfig()]:::mth
  N9603 --> N9608
  N9609[File: prisma.service.ts]:::file
  N8180 --> N9609
  N9610[Class: DrizzleService]:::cls
  N9609 --> N9610
  N9611[user()]:::mth
  N9610 --> N9611
  N9612[agent()]:::mth
  N9610 --> N9612
  N9613[chat()]:::mth
  N9610 --> N9613
  N9614[task()]:::mth
  N9610 --> N9614
  N9615[workflow()]:::mth
  N9610 --> N9615
  N9616[File: prompt-templates.service.ts]:::file
  N8180 --> N9616
  N9617[Class: PromptTemplatesService]:::cls
  N9616 --> N9617
  N9618[createTemplate()]:::mth
  N9617 --> N9618
  N9619[findAllTemplates()]:::mth
  N9617 --> N9619
  N9620[findTemplate()]:::mth
  N9617 --> N9620
  N9621[updateTemplate()]:::mth
  N9617 --> N9621
  N9622[deleteTemplate()]:::mth
  N9617 --> N9622
  N9623[File: provider-keys.service.ts]:::file
  N8180 --> N9623
  N9624[Class: ProviderKeysService]:::cls
  N9623 --> N9624
  N9625[listForUser()]:::mth
  N9624 --> N9625
  N9626[saveForUser()]:::mth
  N9624 --> N9626
  N9627[deleteForUser()]:::mth
  N9624 --> N9627
  N9629[File: rclone-runtime.service.ts]:::file
  N8180 --> N9629
  N9630[Class: RcloneRuntimeService]:::cls
  N9629 --> N9630
  N9631[onModuleInit()]:::mth
  N9630 --> N9631
  N9632[onModuleDestroy()]:::mth
  N9630 --> N9632
  N9633[getArdriveTurboWorkerStatus()]:::mth
  N9630 --> N9633
  N9634[runArdriveTurboWorkerTick()]:::mth
  N9630 --> N9634
  N9635[runArdriveTurboWorkerProcessOne()]:::mth
  N9630 --> N9635
  N9636[Class: target]:::cls
  N9629 --> N9636
  N9637[onModuleInit()]:::mth
  N9636 --> N9637
  N9638[onModuleDestroy()]:::mth
  N9636 --> N9638
  N9639[getArdriveTurboWorkerStatus()]:::mth
  N9636 --> N9639
  N9640[runArdriveTurboWorkerTick()]:::mth
  N9636 --> N9640
  N9641[runArdriveTurboWorkerProcessOne()]:::mth
  N9636 --> N9641
  N9642[Class: rclone]:::cls
  N9629 --> N9642
  N9643[onModuleInit()]:::mth
  N9642 --> N9643
  N9644[onModuleDestroy()]:::mth
  N9642 --> N9644
  N9645[getArdriveTurboWorkerStatus()]:::mth
  N9642 --> N9645
  N9646[runArdriveTurboWorkerTick()]:::mth
  N9642 --> N9646
  N9647[runArdriveTurboWorkerProcessOne()]:::mth
  N9642 --> N9647
  N9648[File: role.service.ts]:::file
  N8180 --> N9648
  N9649[Class: RoleService]:::cls
  N9648 --> N9649
  N9650[findAll()]:::mth
  N9649 --> N9650
  N9651[getAllRoles()]:::mth
  N9649 --> N9651
  N9652[updateRolePermissions()]:::mth
  N9649 --> N9652
  N9653[findById()]:::mth
  N9649 --> N9653
  N9654[create()]:::mth
  N9649 --> N9654
  N9655[File: userService.ts]:::file
  N8180 --> N9655
  N9656[Class: UserService]:::cls
  N9655 --> N9656
  N9657[findAll()]:::mth
  N9656 --> N9657
  N9658[findOne()]:::mth
  N9656 --> N9658
  N9659[findByEmail()]:::mth
  N9656 --> N9659
  N9660[findByUsername()]:::mth
  N9656 --> N9660
  N9661[findUserByEmail()]:::mth
  N9656 --> N9661
  N9662[File: vector-store-grpc.client.ts]:::file
  N8180 --> N9662
  N9663[Class: VectorStoreGrpcClient]:::cls
  N9662 --> N9663
  N9664[onModuleInit()]:::mth
  N9663 --> N9664
  N9665[onModuleDestroy()]:::mth
  N9663 --> N9665
  N9666[createCollection()]:::mth
  N9663 --> N9666
  N9667[deleteCollection()]:::mth
  N9663 --> N9667
  N9668[listCollections()]:::mth
  N9663 --> N9668
  N9669[File: WorkflowExecutionService.ts]:::file
  N8180 --> N9669
  N9670[Class: WorkflowExecutionService]:::cls
  N9669 --> N9670
  N9671[run()]:::mth
  N9670 --> N9671
  N9672[File: WorkflowService.ts]:::file
  N8180 --> N9672
  N9673[Class: WorkflowService]:::cls
  N9672 --> N9673
  N9674[createWorkflow()]:::mth
  N9673 --> N9674
  N9675[getWorkflow()]:::mth
  N9673 --> N9675
  N9676[getUserWorkflows()]:::mth
  N9673 --> N9676
  N9677[updateWorkflow()]:::mth
  N9673 --> N9677
  N9678[deleteWorkflow()]:::mth
  N9673 --> N9678
  N9679[File: workflow-templates.service.ts]:::file
  N8180 --> N9679
  N9680[Class: WorkflowTemplatesService]:::cls
  N9679 --> N9680
  N9681[findAll()]:::mth
  N9680 --> N9681
  N9682[findOne()]:::mth
  N9680 --> N9682
  N9683[create()]:::mth
  N9680 --> N9683
  N9684[update()]:::mth
  N9680 --> N9684
  N9685[remove()]:::mth
  N9680 --> N9685
  N9686[File: workflow.service.ts]:::file
  N8180 --> N9686
  N9687[Class: WorkflowService]:::cls
  N9686 --> N9687
  N9688[createWorkflow()]:::mth
  N9687 --> N9688
  N9689[getWorkflow()]:::mth
  N9687 --> N9689
  N9690[getWorkflows()]:::mth
  N9687 --> N9690
  N9691[executeWorkflow()]:::mth
  N9687 --> N9691
  N9692[getExecutionStatus()]:::mth
  N9687 --> N9692
  N9693[File: smart-account.controller.ts]:::file
  N8180 --> N9693
  N9694[Class: SmartAccountController]:::cls
  N9693 --> N9694
  N9695[enableSmartAccountForAllUsers()]:::mth
  N9694 --> N9695
  N9696[File: smart-account.module.ts]:::file
  N8180 --> N9696
  N9697[Class: SmartAccountModule]:::cls
  N9696 --> N9697
  N9698[File: smart-account.service.ts]:::file
  N8180 --> N9698
  N9699[Class: SmartAccountService]:::cls
  N9698 --> N9699
  N9700[getSmartAccountMetadata()]:::mth
  N9699 --> N9700
  N9701[enableSmartAccountForWallet()]:::mth
  N9699 --> N9701
  N9702[deploySmartAccount()]:::mth
  N9699 --> N9702
  N9703[executeSmartAccountTransaction()]:::mth
  N9699 --> N9703
  N9704[executeBatchSmartAccountTransaction()]:::mth
  N9699 --> N9704
  N9705[File: transactions.controller.ts]:::file
  N8180 --> N9705
  N9706[Class: TransactionsController]:::cls
  N9705 --> N9706
  N9707[File: transactions.module.ts]:::file
  N8180 --> N9707
  N9708[Class: TransactionsModule]:::cls
  N9707 --> N9708
  N9709[File: transactions.service.ts]:::file
  N8180 --> N9709
  N9710[Class: TransactionsService]:::cls
  N9709 --> N9710
  N9711[getSmartAccountCapability()]:::mth
  N9710 --> N9711
  N9712[buildAndSignUserOpForAI()]:::mth
  N9710 --> N9712
  N9713[getSmartAccountAddress()]:::mth
  N9710 --> N9713
  N9714[buildUserOperation()]:::mth
  N9710 --> N9714
  N9715[signUserOperation()]:::mth
  N9710 --> N9715
  N9719[File: logger.ts]:::file
  N8180 --> N9719
  N9720[Class: ConsoleLogger]:::cls
  N9719 --> N9720
  N9721[log()]:::mth
  N9720 --> N9721
  N9722[log()]:::mth
  N9720 --> N9722
  N9723[error()]:::mth
  N9720 --> N9723
  N9724[warn()]:::mth
  N9720 --> N9724
  N9725[debug()]:::mth
  N9720 --> N9725
  N9728[File: wallets.controller.ts]:::file
  N8180 --> N9728
  N9729[Class: WalletsController]:::cls
  N9728 --> N9729
  N9730[File: wallets.module.ts]:::file
  N8180 --> N9730
  N9731[Class: WalletsModule]:::cls
  N9730 --> N9731
  N9732[File: wallets.service.ts]:::file
  N8180 --> N9732
  N9733[Class: WalletsService]:::cls
  N9732 --> N9733
  N9734[createWallet()]:::mth
  N9733 --> N9734
  N9735[enableSmartAccountForWallet()]:::mth
  N9733 --> N9735
  N9736[deploySmartAccountForWallet()]:::mth
  N9733 --> N9736
  N9737[getWalletWithSmartAccountInfo()]:::mth
  N9733 --> N9737
  N9738[getWalletsByUserId()]:::mth
  N9733 --> N9738
  N9739[File: web3auth.module.ts]:::file
  N8180 --> N9739
  N9740[Class: Web3authModule]:::cls
  N9739 --> N9740
  N9741[File: web3auth.service.ts]:::file
  N8180 --> N9741
  N9742[Class: Web3authService]:::cls
  N9741 --> N9742
  N9743[onModuleInit()]:::mth
  N9742 --> N9743
  N9744[getProvider()]:::mth
  N9742 --> N9744
  N9745[deriveAddress()]:::mth
  N9742 --> N9745
  N9746[generateServerSideToken()]:::mth
  N9742 --> N9746
  N9747[disconnect()]:::mth
  N9742 --> N9747
  N9749[File: websocket.gateway.ts]:::file
  N8180 --> N9749
  N9750[Class: WebsocketGateway]:::cls
  N9749 --> N9750
  N9751[handleConnection()]:::mth
  N9750 --> N9751
  N9752[handleDisconnect()]:::mth
  N9750 --> N9752
  N9753[handleMessage()]:::mth
  N9750 --> N9753
  N9755[api-gateway]:::pkg
  TNF --> N9755
  N9756[File: app.module.ts]:::file
  N9755 --> N9756
  N9757[Class: AppModule]:::cls
  N9756 --> N9757
  N9758[File: auth.controller.ts]:::file
  N9755 --> N9758
  N9759[Class: LoginDto]:::cls
  N9758 --> N9759
  N9760[logout()]:::mth
  N9759 --> N9760
  N9761[Class: RegisterDto]:::cls
  N9758 --> N9761
  N9762[logout()]:::mth
  N9761 --> N9762
  N9763[Class: RefreshDto]:::cls
  N9758 --> N9763
  N9764[logout()]:::mth
  N9763 --> N9764
  N9765[Class: GoogleAuthDto]:::cls
  N9758 --> N9765
  N9766[logout()]:::mth
  N9765 --> N9766
  N9767[Class: SupabaseAuthDto]:::cls
  N9758 --> N9767
  N9768[logout()]:::mth
  N9767 --> N9768
  N9769[Class: AuthController]:::cls
  N9758 --> N9769
  N9770[logout()]:::mth
  N9769 --> N9770
  N9771[File: auth.module.ts]:::file
  N9755 --> N9771
  N9772[Class: AuthModule]:::cls
  N9771 --> N9772
  N9773[File: gateway-auth.guard.ts]:::file
  N9755 --> N9773
  N9774[Class: GatewayAuthGuard]:::cls
  N9773 --> N9774
  N9775[canActivate()]:::mth
  N9774 --> N9775
  N9776[extractTokenFromHeader()]:::mth
  N9774 --> N9776
  N9777[File: gateway-auth.service.ts]:::file
  N9755 --> N9777
  N9778[Class: GatewayAuthService]:::cls
  N9777 --> N9778
  N9779[onModuleDestroy()]:::mth
  N9778 --> N9779
  N9780[login()]:::mth
  N9778 --> N9780
  N9781[register()]:::mth
  N9778 --> N9781
  N9782[refresh()]:::mth
  N9778 --> N9782
  N9783[me()]:::mth
  N9778 --> N9783
  N9784[File: global-exception.filter.ts]:::file
  N9755 --> N9784
  N9785[Class: GlobalExceptionFilter]:::cls
  N9784 --> N9785
  N9786[File: agent-gateway.controller.ts]:::file
  N9755 --> N9786
  N9787[Class: AgentGatewayController]:::cls
  N9786 --> N9787
  N9788[File: agent-gateway.module.ts]:::file
  N9755 --> N9788
  N9789[Class: AgentGatewayModule]:::cls
  N9788 --> N9789
  N9790[File: analytics-gateway.controller.ts]:::file
  N9755 --> N9790
  N9791[Class: AnalyticsGatewayController]:::cls
  N9790 --> N9791
  N9792[File: analytics-gateway.module.ts]:::file
  N9755 --> N9792
  N9793[Class: AnalyticsGatewayModule]:::cls
  N9792 --> N9793
  N9794[File: chat-gateway.controller.ts]:::file
  N9755 --> N9794
  N9795[Class: ChatGatewayController]:::cls
  N9794 --> N9795
  N9796[File: chat-gateway.module.ts]:::file
  N9755 --> N9796
  N9797[Class: ChatGatewayModule]:::cls
  N9796 --> N9797
  N9798[File: ide-gateway.controller.ts]:::file
  N9755 --> N9798
  N9799[Class: IdeGatewayController]:::cls
  N9798 --> N9799
  N9800[File: ide-gateway.module.ts]:::file
  N9755 --> N9800
  N9801[Class: IdeGatewayModule]:::cls
  N9800 --> N9801
  N9802[File: jules-webhook.controller.ts]:::file
  N9755 --> N9802
  N9803[Class: JulesWebhookController]:::cls
  N9802 --> N9803
  N9804[File: jules-webhook.module.ts]:::file
  N9755 --> N9804
  N9805[Class: JulesUsageTracker]:::cls
  N9804 --> N9805
  N9806[logUsageStart()]:::mth
  N9805 --> N9806
  N9807[logUsageEnd()]:::mth
  N9805 --> N9807
  N9808[handleWebhook()]:::mth
  N9805 --> N9808
  N9809[Class: NoopJulesWebhookHandler]:::cls
  N9804 --> N9809
  N9810[logUsageStart()]:::mth
  N9809 --> N9810
  N9811[logUsageEnd()]:::mth
  N9809 --> N9811
  N9812[handleWebhook()]:::mth
  N9809 --> N9812
  N9813[Class: JulesWebhookModule]:::cls
  N9804 --> N9813
  N9814[logUsageStart()]:::mth
  N9813 --> N9814
  N9815[logUsageEnd()]:::mth
  N9813 --> N9815
  N9816[handleWebhook()]:::mth
  N9813 --> N9816
  N9817[File: jules-webhook.payload.ts]:::file
  N9755 --> N9817
  N9818[Class: JulesWebhookPayload]:::cls
  N9817 --> N9818
  N9819[File: marketplace-gateway.controller.ts]:::file
  N9755 --> N9819
  N9820[Class: MarketplaceGatewayController]:::cls
  N9819 --> N9820
  N9821[proxyWithFallback()]:::mth
  N9820 --> N9821
  N9822[File: marketplace-gateway.module.ts]:::file
  N9755 --> N9822
  N9823[Class: MarketplaceGatewayModule]:::cls
  N9822 --> N9823
  N9824[File: mcp-gateway.controller.ts]:::file
  N9755 --> N9824
  N9825[Class: McpGatewayController]:::cls
  N9824 --> N9825
  N9826[File: mcp-gateway.module.ts]:::file
  N9755 --> N9826
  N9827[Class: McpGatewayModule]:::cls
  N9826 --> N9827
  N9828[File: nexus-observability-gateway.controller.ts]:::file
  N9755 --> N9828
  N9829[Class: NexusObservabilityGatewayController]:::cls
  N9828 --> N9829
  N9830[proxyReadOnlyEndpoint()]:::mth
  N9829 --> N9830
  N9831[File: nexus-observability-gateway.module.ts]:::file
  N9755 --> N9831
  N9832[Class: NexusObservabilityGatewayModule]:::cls
  N9831 --> N9832
  N9833[File: poker-gateway.controller.ts]:::file
  N9755 --> N9833
  N9834[Class: PokerGatewayController]:::cls
  N9833 --> N9834
  N9835[File: poker-gateway.module.ts]:::file
  N9755 --> N9835
  N9836[Class: PokerGatewayModule]:::cls
  N9835 --> N9836
  N9837[File: sgp-gateway.controller.ts]:::file
  N9755 --> N9837
  N9838[Class: TranslateToNestDto]:::cls
  N9837 --> N9838
  N9839[Class: TranslateFromNestDto]:::cls
  N9837 --> N9839
  N9840[Class: SgpGatewayController]:::cls
  N9837 --> N9840
  N9841[File: sgp-gateway.module.ts]:::file
  N9755 --> N9841
  N9842[Class: SgpGatewayModule]:::cls
  N9841 --> N9842
  N9844[File: sgp-nestjs-translation.service.ts]:::file
  N9755 --> N9844
  N9845[Class: SgpNestjsTranslationService]:::cls
  N9844 --> N9845
  N9846[toNestPacket()]:::mth
  N9845 --> N9846
  N9847[fromNestPacket()]:::mth
  N9845 --> N9847
  N9848[assertSgpEnvelope()]:::mth
  N9845 --> N9848
  N9849[assertNestPacket()]:::mth
  N9845 --> N9849
  N9850[sgpTypeToNestPattern()]:::mth
  N9845 --> N9850
  N9851[File: system-gateway.controller.ts]:::file
  N9755 --> N9851
  N9852[Class: SystemGatewayController]:::cls
  N9851 --> N9852
  N9853[normalizeMasterClockPayload()]:::mth
  N9852 --> N9853
  N9854[toTimestampMs()]:::mth
  N9852 --> N9854
  N9855[parsePositiveInt()]:::mth
  N9852 --> N9855
  N9856[buildProcessStats()]:::mth
  N9852 --> N9856
  N9857[buildProjectedSuperCycleProcesses()]:::mth
  N9852 --> N9857
  N9858[File: system-gateway.module.ts]:::file
  N9755 --> N9858
  N9859[Class: SystemGatewayModule]:::cls
  N9858 --> N9859
  N9860[File: terminals-gateway.controller.ts]:::file
  N9755 --> N9860
  N9861[Class: TerminalsGatewayController]:::cls
  N9860 --> N9861
  N9862[proxyGraph()]:::mth
  N9861 --> N9862
  N9863[File: terminals-gateway.module.ts]:::file
  N9755 --> N9863
  N9864[Class: TerminalsGatewayModule]:::cls
  N9863 --> N9864
  N9865[File: timeline-gateway.controller.ts]:::file
  N9755 --> N9865
  N9866[Class: TimelineGatewayController]:::cls
  N9865 --> N9866
  N9867[File: timeline-gateway.module.ts]:::file
  N9755 --> N9867
  N9868[Class: TimelineGatewayModule]:::cls
  N9867 --> N9868
  N9869[File: webhook-gateway.controller.ts]:::file
  N9755 --> N9869
  N9870[Class: WebhookGatewayController]:::cls
  N9869 --> N9870
  N9871[File: webhook-gateway.module.ts]:::file
  N9755 --> N9871
  N9872[Class: WebhookGatewayModule]:::cls
  N9871 --> N9872
  N9873[File: workspace-gateway.controller.ts]:::file
  N9755 --> N9873
  N9874[Class: WorkspaceGatewayController]:::cls
  N9873 --> N9874
  N9875[File: workspace-gateway.module.ts]:::file
  N9755 --> N9875
  N9876[Class: WorkspaceGatewayModule]:::cls
  N9875 --> N9876
  N9877[File: logging.interceptor.ts]:::file
  N9755 --> N9877
  N9878[Class: LoggingInterceptor]:::cls
  N9877 --> N9878
  N9879[intercept()]:::mth
  N9878 --> N9879
  N9880[File: response.interceptor.ts]:::file
  N9755 --> N9880
  N9881[Class: ResponseInterceptor]:::cls
  N9880 --> N9881
  N9882[intercept()]:::mth
  N9881 --> N9882
  N9884[File: proxy.controller.ts]:::file
  N9755 --> N9884
  N9885[Class: ProxyController]:::cls
  N9884 --> N9885
  N9886[getServicesHealth()]:::mth
  N9885 --> N9886
  N9887[getServices()]:::mth
  N9885 --> N9887
  N9888[File: proxy.module.ts]:::file
  N9755 --> N9888
  N9889[Class: ProxyModule]:::cls
  N9888 --> N9889
  N9890[File: proxy.service.ts]:::file
  N9755 --> N9890
  N9891[Class: ProxyService]:::cls
  N9890 --> N9891
  N9892[initializeServices()]:::mth
  N9891 --> N9892
  N9893[registerService()]:::mth
  N9891 --> N9893
  N9894[proxyRequest()]:::mth
  N9891 --> N9894
  N9895[checkServiceHealth()]:::mth
  N9891 --> N9895
  N9896[getAllServicesHealth()]:::mth
  N9891 --> N9896
  N9898[audio-trigger-kws-mvp]:::pkg
  TNF --> N9898
  N9906[File: audio-trigger-runtime.ts]:::file
  N9898 --> N9906
  N9907[Class: AudioTriggerRuntime]:::cls
  N9906 --> N9907
  N9908[loadAdditionalRules()]:::mth
  N9907 --> N9908
  N9909[start()]:::mth
  N9907 --> N9909
  N9910[stop()]:::mth
  N9907 --> N9910
  N9911[ingestText()]:::mth
  N9907 --> N9911
  N9912[flush()]:::mth
  N9907 --> N9912
  N9914[File: agent-router.ts]:::file
  N9898 --> N9914
  N9915[Class: AgentRouter]:::cls
  N9914 --> N9915
  N9916[processHit()]:::mth
  N9915 --> N9916
  N9917[detectAgent()]:::mth
  N9915 --> N9917
  N9918[routeToAgent()]:::mth
  N9915 --> N9918
  N9919[broadcast()]:::mth
  N9915 --> N9919
  N9920[injectToTty()]:::mth
  N9915 --> N9920
  N9921[File: audio-gateway.ts]:::file
  N9898 --> N9921
  N9922[Class: AudioGateway]:::cls
  N9921 --> N9922
  N9923[File: echo-suppression.ts]:::file
  N9898 --> N9923
  N9924[Class: EchoSuppression]:::cls
  N9923 --> N9924
  N9925[speaking()]:::mth
  N9924 --> N9925
  N9926[markSpeakingStart()]:::mth
  N9924 --> N9926
  N9927[markSpeakingEnd()]:::mth
  N9924 --> N9927
  N9928[isSpeaking()]:::mth
  N9924 --> N9928
  N9929[filterHit()]:::mth
  N9924 --> N9929
  N9930[File: enricher.ts]:::file
  N9898 --> N9930
  N9931[Class: Enricher]:::cls
  N9930 --> N9931
  N9932[buildContextPackage()]:::mth
  N9931 --> N9932
  N9933[File: grouping-filter.ts]:::file
  N9898 --> N9933
  N9934[Class: GroupingFilter]:::cls
  N9933 --> N9934
  N9935[push()]:::mth
  N9934 --> N9935
  N9936[File: kws-engine.ts]:::file
  N9898 --> N9936
  N9937[Class: KwsEngine]:::cls
  N9936 --> N9937
  N9938[push()]:::mth
  N9937 --> N9938
  N9939[buildHitEvent()]:::mth
  N9937 --> N9939
  N9940[File: mini-omni-client.ts]:::file
  N9898 --> N9940
  N9941[Class: MiniOmniClient]:::cls
  N9940 --> N9941
  N9942[complete()]:::mth
  N9941 --> N9942
  N9943[completeOpenAiCompat()]:::mth
  N9941 --> N9943
  N9944[completeNativeChat()]:::mth
  N9941 --> N9944
  N9945[resolveOpenAiCompatEndpoint()]:::mth
  N9941 --> N9945
  N9946[resolveNativeChatEndpoint()]:::mth
  N9941 --> N9946
  N9947[File: openai-compat-client.ts]:::file
  N9898 --> N9947
  N9948[Class: OpenaiCompatClient]:::cls
  N9947 --> N9948
  N9949[complete()]:::mth
  N9948 --> N9949
  N9950[complete()]:::mth
  N9948 --> N9950
  N9951[File: llm-batcher.ts]:::file
  N9898 --> N9951
  N9952[Class: LlmBatcher]:::cls
  N9951 --> N9952
  N9953[start()]:::mth
  N9952 --> N9953
  N9954[stop()]:::mth
  N9952 --> N9954
  N9955[enqueue()]:::mth
  N9952 --> N9955
  N9956[getQueueDepth()]:::mth
  N9952 --> N9956
  N9957[flush()]:::mth
  N9952 --> N9957
  N9959[File: service.ts]:::file
  N9898 --> N9959
  N9960[Class: ProfileService]:::cls
  N9959 --> N9960
  N9961[getProfilesDirectory()]:::mth
  N9960 --> N9961
  N9962[getProfile()]:::mth
  N9960 --> N9962
  N9963[updateProfile()]:::mth
  N9960 --> N9963
  N9964[getProfileIds()]:::mth
  N9960 --> N9964
  N9965[getTriggerThreshold()]:::mth
  N9960 --> N9965
  N9966[File: rule-engine.ts]:::file
  N9898 --> N9966
  N9967[Class: RuleEngine]:::cls
  N9966 --> N9967
  N9968[push()]:::mth
  N9967 --> N9968
  N9969[evaluateRule()]:::mth
  N9967 --> N9969
  N9970[evaluateCondition()]:::mth
  N9967 --> N9970
  N9971[evaluateHitCondition()]:::mth
  N9967 --> N9971
  N9972[evaluateSequenceCondition()]:::mth
  N9967 --> N9972
  N9973[File: vad-gate.ts]:::file
  N9898 --> N9973
  N9974[Class: VadGate]:::cls
  N9973 --> N9974
  N9975[push()]:::mth
  N9974 --> N9975
  N9976[File: websocket.service.ts]:::file
  N9898 --> N9976
  N9977[Class: WebSocketService]:::cls
  N9976 --> N9977
  N9978[connect()]:::mth
  N9977 --> N9978
  N9979[register()]:::mth
  N9977 --> N9979
  N9980[broadcast()]:::mth
  N9977 --> N9980
  N9983[backend]:::pkg
  TNF --> N9983
  N9986[File: agent.module.ts]:::file
  N9983 --> N9986
  N9987[Class: AgentModule]:::cls
  N9986 --> N9987
  N9988[File: AlertService.ts]:::file
  N9983 --> N9988
  N9989[Class: AlertService]:::cls
  N9988 --> N9989
  N9990[sendAlert()]:::mth
  N9989 --> N9990
  N9991[info()]:::mth
  N9989 --> N9991
  N9992[warning()]:::mth
  N9989 --> N9992
  N9993[error()]:::mth
  N9989 --> N9993
  N9994[critical()]:::mth
  N9989 --> N9994
  N9995[File: InterAgentChatService.ts]:::file
  N9983 --> N9995
  N9996[Class: InterAgentChatService]:::cls
  N9995 --> N9996
  N9997[onModuleInit()]:::mth
  N9996 --> N9997
  N9998[subscribeToAgentChannel()]:::mth
  N9996 --> N9998
  N9999[handleIncomingMessage()]:::mth
  N9996 --> N9999
  N10000[sendMessage()]:::mth
  N9996 --> N10000
  N10001[broadcastMessage()]:::mth
  N9996 --> N10001
  N10002[File: MonitoringService.ts]:::file
  N9983 --> N10002
  N10003[Class: MonitoringService]:::cls
  N10002 --> N10003
  N10004[logEvent()]:::mth
  N10003 --> N10004
  N10005[recordMetric()]:::mth
  N10003 --> N10005
  N10006[startMonitoring()]:::mth
  N10003 --> N10006
  N10007[stopMonitoring()]:::mth
  N10003 --> N10007
  N10008[checkHealth()]:::mth
  N10003 --> N10008
  N10009[File: PrometheusService.ts]:::file
  N9983 --> N10009
  N10010[Class: PrometheusService]:::cls
  N10009 --> N10010
  N10011[registerMetric()]:::mth
  N10010 --> N10011
  N10012[incrementCounter()]:::mth
  N10010 --> N10012
  N10013[setGauge()]:::mth
  N10010 --> N10013
  N10014[observeHistogram()]:::mth
  N10010 --> N10014
  N10015[getMetrics()]:::mth
  N10010 --> N10015
  N10016[File: AIResourceMonitorAgent.ts]:::file
  N9983 --> N10016
  N10017[Class: AIResourceMonitorAgent]:::cls
  N10016 --> N10017
  N10018[monitorTwitter()]:::mth
  N10017 --> N10018
  N10019[processAnnouncement()]:::mth
  N10017 --> N10019
  N10020[monitorBlogs()]:::mth
  N10017 --> N10020
  N10021[monitorTechNews()]:::mth
  N10017 --> N10021
  N10022[monitorReddit()]:::mth
  N10017 --> N10022
  N10023[File: CodebaseIndexerAgent.ts]:::file
  N9983 --> N10023
  N10024[Class: CodebaseIndexerAgent]:::cls
  N10023 --> N10024
  N10025[runFullIndex()]:::mth
  N10024 --> N10025
  N10026[runIncrementalIndex()]:::mth
  N10024 --> N10026
  N10027[runSynergyAnalysis()]:::mth
  N10024 --> N10027
  N10028[scanCodebase()]:::mth
  N10024 --> N10028
  N10029[extractResources()]:::mth
  N10024 --> N10029
  N10030[File: agent.controller.ts]:::file
  N9983 --> N10030
  N10031[Class: CreateAgentDto]:::cls
  N10030 --> N10031
  N10032[getAgents()]:::mth
  N10031 --> N10032
  N10033[getActiveAgents()]:::mth
  N10031 --> N10033
  N10034[discoverAgents()]:::mth
  N10031 --> N10034
  N10035[getFrontloadSnapshot()]:::mth
  N10031 --> N10035
  N10036[Class: UpdateAgentDto]:::cls
  N10030 --> N10036
  N10037[getAgents()]:::mth
  N10036 --> N10037
  N10038[getActiveAgents()]:::mth
  N10036 --> N10038
  N10039[discoverAgents()]:::mth
  N10036 --> N10039
  N10040[getFrontloadSnapshot()]:::mth
  N10036 --> N10040
  N10041[Class: AgentController]:::cls
  N10030 --> N10041
  N10042[getAgents()]:::mth
  N10041 --> N10042
  N10043[getActiveAgents()]:::mth
  N10041 --> N10043
  N10044[discoverAgents()]:::mth
  N10041 --> N10044
  N10045[getFrontloadSnapshot()]:::mth
  N10041 --> N10045
  N10046[File: analytics.controller.ts]:::file
  N9983 --> N10046
  N10047[Class: AnalyticsController]:::cls
  N10046 --> N10047
  N10048[Number()]:::mth
  N10047 --> N10048
  N10049[Number()]:::mth
  N10047 --> N10049
  N10050[File: api.module.ts]:::file
  N9983 --> N10050
  N10051[Class: ApiModule]:::cls
  N10050 --> N10051
  N10052[File: nexus-observability.controller.ts]:::file
  N9983 --> N10052
  N10053[Class: NexusObservabilityController]:::cls
  N10052 --> N10053
  N10054[getOrchestratorHealth()]:::mth
  N10053 --> N10054
  N10055[getOrchestratorAgents()]:::mth
  N10053 --> N10055
  N10056[getSystemHealth()]:::mth
  N10053 --> N10056
  N10057[getSystemStatus()]:::mth
  N10053 --> N10057
  N10058[getGraphArtifactsIndex()]:::mth
  N10053 --> N10058
  N10059[File: system.controller.ts]:::file
  N9983 --> N10059
  N10060[Class: SystemController]:::cls
  N10059 --> N10060
  N10061[getServicesStatus()]:::mth
  N10060 --> N10061
  N10062[getSystemMetrics()]:::mth
  N10060 --> N10062
  N10063[getSystemTools()]:::mth
  N10060 --> N10063
  N10064[checkPortStatus()]:::mth
  N10060 --> N10064
  N10065[checkDockerContainer()]:::mth
  N10060 --> N10065
  N10066[File: tnf-registry.service.ts]:::file
  N9983 --> N10066
  N10067[Class: TnfRegistryService]:::cls
  N10066 --> N10067
  N10068[rows()]:::mth
  N10067 --> N10068
  N10069[searchIntelligence()]:::mth
  N10067 --> N10069
  N10070[getDiscoverableAgents()]:::mth
  N10067 --> N10070
  N10071[getFrontloadSnapshot()]:::mth
  N10067 --> N10071
  N10072[File: app.controller.ts]:::file
  N9983 --> N10072
  N10073[Class: AppController]:::cls
  N10072 --> N10073
  N10074[getHello()]:::mth
  N10073 --> N10074
  N10075[getHealth()]:::mth
  N10073 --> N10075
  N10076[File: app.module.ts]:::file
  N9983 --> N10076
  N10077[Class: AppModule]:::cls
  N10076 --> N10077
  N10078[configure()]:::mth
  N10077 --> N10078
  N10079[File: app.service.ts]:::file
  N9983 --> N10079
  N10080[Class: AppService]:::cls
  N10079 --> N10080
  N10081[getHello()]:::mth
  N10080 --> N10081
  N10082[File: admin.guard.ts]:::file
  N9983 --> N10082
  N10083[Class: AdminGuard]:::cls
  N10082 --> N10083
  N10084[canActivate()]:::mth
  N10083 --> N10084
  N10085[File: agent-jwt.strategy.ts]:::file
  N9983 --> N10085
  N10086[Class: AgentJwtStrategy]:::cls
  N10085 --> N10086
  N10087[PassportStrategy()]:::mth
  N10086 --> N10087
  N10088[validate()]:::mth
  N10086 --> N10088
  N10089[extractAgentTokenFromHeader()]:::mth
  N10086 --> N10089
  N10090[createWithCustomExtractor()]:::mth
  N10086 --> N10090
  N10091[Class: extends]:::cls
  N10085 --> N10091
  N10092[PassportStrategy()]:::mth
  N10091 --> N10092
  N10093[validate()]:::mth
  N10091 --> N10093
  N10094[extractAgentTokenFromHeader()]:::mth
  N10091 --> N10094
  N10095[createWithCustomExtractor()]:::mth
  N10091 --> N10095
  N10096[File: agent.auth.guard.ts]:::file
  N9983 --> N10096
  N10097[Class: AgentAuthGuard]:::cls
  N10096 --> N10097
  N10098[canActivate()]:::mth
  N10097 --> N10098
  N10099[extractTokenFromHeader()]:::mth
  N10097 --> N10099
  N10100[extractApiKeyFromHeader()]:::mth
  N10097 --> N10100
  N10101[validateJwtToken()]:::mth
  N10097 --> N10101
  N10102[validateAgentApiKey()]:::mth
  N10097 --> N10102
  N10104[File: auth.controller.ts]:::file
  N9983 --> N10104
  N10105[Class: LoginDto]:::cls
  N10104 --> N10105
  N10106[googleAuth()]:::mth
  N10105 --> N10106
  N10107[githubAuth()]:::mth
  N10105 --> N10107
  N10108[Class: AuthController]:::cls
  N10104 --> N10108
  N10109[googleAuth()]:::mth
  N10108 --> N10109
  N10110[githubAuth()]:::mth
  N10108 --> N10110
  N10111[File: auth.module.ts]:::file
  N9983 --> N10111
  N10112[Class: AuthModule]:::cls
  N10111 --> N10112
  N10114[File: auth.service.ts]:::file
  N9983 --> N10114
  N10115[Class: AuthService]:::cls
  N10114 --> N10115
  N10116[validateUser()]:::mth
  N10115 --> N10116
  N10117[login()]:::mth
  N10115 --> N10117
  N10118[register()]:::mth
  N10115 --> N10118
  N10119[generateVerificationToken()]:::mth
  N10115 --> N10119
  N10120[verifyEmail()]:::mth
  N10115 --> N10120
  N10121[File: base-oauth.strategy.ts]:::file
  N9983 --> N10121
  N10122[Class: for]:::cls
  N10121 --> N10122
  N10123[getProviderIdField()]:::mth
  N10122 --> N10123
  N10124[Class: BaseOAuthStrategy]:::cls
  N10121 --> N10124
  N10125[getProviderIdField()]:::mth
  N10124 --> N10125
  N10128[File: auth.events.ts]:::file
  N9983 --> N10128
  N10129[Class: UserLoginEvent]:::cls
  N10128 --> N10129
  N10130[Class: UserLogoutEvent]:::cls
  N10128 --> N10130
  N10131[Class: UserRegisteredEvent]:::cls
  N10128 --> N10131
  N10132[Class: PasswordResetEvent]:::cls
  N10128 --> N10132
  N10133[File: github.strategy.ts]:::file
  N9983 --> N10133
  N10134[Class: GitHubStrategy]:::cls
  N10133 --> N10134
  N10135[PassportStrategy()]:::mth
  N10134 --> N10135
  N10136[new()]:::mth
  N10134 --> N10136
  N10137[getProviderName()]:::mth
  N10134 --> N10137
  N10138[validate()]:::mth
  N10134 --> N10138
  N10139[Class: extends]:::cls
  N10133 --> N10139
  N10140[PassportStrategy()]:::mth
  N10139 --> N10140
  N10141[new()]:::mth
  N10139 --> N10141
  N10142[getProviderName()]:::mth
  N10139 --> N10142
  N10143[validate()]:::mth
  N10139 --> N10143
  N10144[File: google.service.ts]:::file
  N9983 --> N10144
  N10145[Class: GoogleAuthService]:::cls
  N10144 --> N10145
  N10146[handleCallback()]:::mth
  N10145 --> N10146
  N10147[File: google.strategy.ts]:::file
  N9983 --> N10147
  N10148[Class: GoogleStrategy]:::cls
  N10147 --> N10148
  N10149[PassportStrategy()]:::mth
  N10148 --> N10149
  N10150[new()]:::mth
  N10148 --> N10150
  N10151[getProviderName()]:::mth
  N10148 --> N10151
  N10152[validate()]:::mth
  N10148 --> N10152
  N10153[Class: extends]:::cls
  N10147 --> N10153
  N10154[PassportStrategy()]:::mth
  N10153 --> N10154
  N10155[new()]:::mth
  N10153 --> N10155
  N10156[getProviderName()]:::mth
  N10153 --> N10156
  N10157[validate()]:::mth
  N10153 --> N10157
  N10158[File: jwt-auth.guard.ts]:::file
  N9983 --> N10158
  N10159[Class: JwtAuthGuard]:::cls
  N10158 --> N10159
  N10160[AuthGuard()]:::mth
  N10159 --> N10160
  N10161[canActivate()]:::mth
  N10159 --> N10161
  N10162[File: roles.guard.ts]:::file
  N9983 --> N10162
  N10163[Class: RolesGuard]:::cls
  N10162 --> N10163
  N10164[canActivate()]:::mth
  N10163 --> N10164
  N10165[File: jwt-blacklist.guard.ts]:::file
  N9983 --> N10165
  N10166[Class: JwtBlacklistGuard]:::cls
  N10165 --> N10166
  N10167[canActivate()]:::mth
  N10166 --> N10167
  N10168[extractTokenFromHeader()]:::mth
  N10166 --> N10168
  N10170[File: jwt.strategy.ts]:::file
  N9983 --> N10170
  N10171[Class: JwtStrategy]:::cls
  N10170 --> N10171
  N10172[PassportStrategy()]:::mth
  N10171 --> N10172
  N10173[validate()]:::mth
  N10171 --> N10173
  N10174[File: supabase-auth.guard.ts]:::file
  N9983 --> N10174
  N10175[Class: SupabaseAuthGuard]:::cls
  N10174 --> N10175
  N10176[canActivate()]:::mth
  N10175 --> N10176
  N10177[File: token-blacklist.service.ts]:::file
  N9983 --> N10177
  N10178[Class: TokenBlacklistService]:::cls
  N10177 --> N10178
  N10179[blacklistToken()]:::mth
  N10178 --> N10179
  N10180[isBlacklisted()]:::mth
  N10178 --> N10180
  N10181[blacklistAllUserTokens()]:::mth
  N10178 --> N10181
  N10182[cleanup()]:::mth
  N10178 --> N10182
  N10183[getStats()]:::mth
  N10178 --> N10183
  N10184[File: ws-auth.guard.ts]:::file
  N9983 --> N10184
  N10185[Class: WsAuthGuard]:::cls
  N10184 --> N10185
  N10186[canActivate()]:::mth
  N10185 --> N10186
  N10187[extractTokenFromHeader()]:::mth
  N10185 --> N10187
  N10188[File: CacheService.ts]:::file
  N9983 --> N10188
  N10189[Class: CacheService]:::cls
  N10188 --> N10189
  N10190[getKey()]:::mth
  N10189 --> N10190
  N10191[delete()]:::mth
  N10189 --> N10191
  N10192[has()]:::mth
  N10189 --> N10192
  N10193[clear()]:::mth
  N10189 --> N10193
  N10194[close()]:::mth
  N10189 --> N10194
  N10195[File: cache.controller.ts]:::file
  N9983 --> N10195
  N10196[Class: CacheController]:::cls
  N10195 --> N10196
  N10197[getStats()]:::mth
  N10196 --> N10197
  N10198[getMetrics()]:::mth
  N10196 --> N10198
  N10199[parseInt()]:::mth
  N10196 --> N10199
  N10200[parseInt()]:::mth
  N10196 --> N10200
  N10201[clearAllCache()]:::mth
  N10196 --> N10201
  N10202[File: cache.module.ts]:::file
  N9983 --> N10202
  N10203[Class: CacheModule]:::cls
  N10202 --> N10203
  N10204[File: cache.service.ts]:::file
  N9983 --> N10204
  N10205[Class: CacheService]:::cls
  N10204 --> N10205
  N10206[set()]:::mth
  N10205 --> N10206
  N10207[delete()]:::mth
  N10205 --> N10207
  N10208[exists()]:::mth
  N10205 --> N10208
  N10209[hset()]:::mth
  N10205 --> N10209
  N10212[File: cache-usage.example.ts]:::file
  N9983 --> N10212
  N10213[Class: UserService]:::cls
  N10212 --> N10213
  N10214[getUserById()]:::mth
  N10213 --> N10214
  N10215[updateUser()]:::mth
  N10213 --> N10215
  N10216[createUser()]:::mth
  N10213 --> N10216
  N10217[bulkDeleteUsers()]:::mth
  N10213 --> N10217
  N10218[getProducts()]:::mth
  N10213 --> N10218
  N10219[Class: ProductController]:::cls
  N10212 --> N10219
  N10220[getUserById()]:::mth
  N10219 --> N10220
  N10221[updateUser()]:::mth
  N10219 --> N10221
  N10222[createUser()]:::mth
  N10219 --> N10222
  N10223[bulkDeleteUsers()]:::mth
  N10219 --> N10223
  N10224[getProducts()]:::mth
  N10219 --> N10224
  N10225[Class: ManualCacheExample]:::cls
  N10212 --> N10225
  N10226[getUserById()]:::mth
  N10225 --> N10226
  N10227[updateUser()]:::mth
  N10225 --> N10227
  N10228[createUser()]:::mth
  N10225 --> N10228
  N10229[bulkDeleteUsers()]:::mth
  N10225 --> N10229
  N10230[getProducts()]:::mth
  N10225 --> N10230
  N10231[Class: DatabaseCacheExample]:::cls
  N10212 --> N10231
  N10232[getUserById()]:::mth
  N10231 --> N10232
  N10233[updateUser()]:::mth
  N10231 --> N10233
  N10234[createUser()]:::mth
  N10231 --> N10234
  N10235[bulkDeleteUsers()]:::mth
  N10231 --> N10235
  N10236[getProducts()]:::mth
  N10231 --> N10236
  N10237[Class: SessionCacheExample]:::cls
  N10212 --> N10237
  N10238[getUserById()]:::mth
  N10237 --> N10238
  N10239[updateUser()]:::mth
  N10237 --> N10239
  N10240[createUser()]:::mth
  N10237 --> N10240
  N10241[bulkDeleteUsers()]:::mth
  N10237 --> N10241
  N10242[getProducts()]:::mth
  N10237 --> N10242
  N10243[Class: CacheWarmingExample]:::cls
  N10212 --> N10243
  N10244[getUserById()]:::mth
  N10243 --> N10244
  N10245[updateUser()]:::mth
  N10243 --> N10245
  N10246[createUser()]:::mth
  N10243 --> N10246
  N10247[bulkDeleteUsers()]:::mth
  N10243 --> N10247
  N10248[getProducts()]:::mth
  N10243 --> N10248
  N10249[Class: CacheInvalidationExample]:::cls
  N10212 --> N10249
  N10250[getUserById()]:::mth
  N10249 --> N10250
  N10251[updateUser()]:::mth
  N10249 --> N10251
  N10252[createUser()]:::mth
  N10249 --> N10252
  N10253[bulkDeleteUsers()]:::mth
  N10249 --> N10253
  N10254[getProducts()]:::mth
  N10249 --> N10254
  N10255[Class: CacheRefreshExample]:::cls
  N10212 --> N10255
  N10256[getUserById()]:::mth
  N10255 --> N10256
  N10257[updateUser()]:::mth
  N10255 --> N10257
  N10258[createUser()]:::mth
  N10255 --> N10258
  N10259[bulkDeleteUsers()]:::mth
  N10255 --> N10259
  N10260[getProducts()]:::mth
  N10255 --> N10260
  N10262[File: cache.interceptor.ts]:::file
  N9983 --> N10262
  N10263[Class: CacheInterceptor]:::cls
  N10262 --> N10263
  N10264[intercept()]:::mth
  N10263 --> N10264
  N10265[handlePostExecution()]:::mth
  N10263 --> N10265
  N10266[handleEviction()]:::mth
  N10263 --> N10266
  N10267[handleInvalidation()]:::mth
  N10263 --> N10267
  N10268[createDefaultKey()]:::mth
  N10263 --> N10268
  N10269[File: http-cache.interceptor.ts]:::file
  N9983 --> N10269
  N10270[Class: HttpCacheInterceptor]:::cls
  N10269 --> N10270
  N10271[intercept()]:::mth
  N10270 --> N10271
  N10272[generateCacheKey()]:::mth
  N10270 --> N10272
  N10273[setCacheHeaders()]:::mth
  N10270 --> N10273
  N10274[generateETag()]:::mth
  N10270 --> N10274
  N10275[File: advanced-cache.manager.ts]:::file
  N9983 --> N10275
  N10276[Class: AdvancedCacheManager]:::cls
  N10275 --> N10276
  N10277[onModuleInit()]:::mth
  N10276 --> N10277
  N10278[onModuleDestroy()]:::mth
  N10276 --> N10278
  N10279[generateKey()]:::mth
  N10276 --> N10279
  N10280[delete()]:::mth
  N10276 --> N10280
  N10281[deletePattern()]:::mth
  N10276 --> N10281
  N10282[File: cache-invalidation.service.ts]:::file
  N9983 --> N10282
  N10283[Class: CacheInvalidationService]:::cls
  N10282 --> N10283
  N10284[onModuleInit()]:::mth
  N10283 --> N10284
  N10285[onModuleDestroy()]:::mth
  N10283 --> N10285
  N10286[registerRule()]:::mth
  N10283 --> N10286
  N10287[unregisterRule()]:::mth
  N10283 --> N10287
  N10288[invalidate()]:::mth
  N10283 --> N10288
  N10289[File: cache-monitoring.service.ts]:::file
  N9983 --> N10289
  N10290[Class: CacheMonitoringService]:::cls
  N10289 --> N10290
  N10291[startMetricsAggregation()]:::mth
  N10290 --> N10291
  N10292[onModuleDestroy()]:::mth
  N10290 --> N10292
  N10293[recordHit()]:::mth
  N10290 --> N10293
  N10294[recordMiss()]:::mth
  N10290 --> N10294
  N10295[updateKeyMetrics()]:::mth
  N10290 --> N10295
  N10296[File: cache-warming.service.ts]:::file
  N9983 --> N10296
  N10297[Class: CacheWarmingService]:::cls
  N10296 --> N10297
  N10298[onModuleInit()]:::mth
  N10297 --> N10298
  N10299[registerTask()]:::mth
  N10297 --> N10299
  N10300[unregisterTask()]:::mth
  N10297 --> N10300
  N10301[executeTask()]:::mth
  N10297 --> N10301
  N10302[executeAllTasks()]:::mth
  N10297 --> N10302
  N10303[File: database-cache.service.ts]:::file
  N9983 --> N10303
  N10304[Class: DatabaseCacheService]:::cls
  N10303 --> N10304
  N10305[invalidateEntity()]:::mth
  N10304 --> N10305
  N10306[invalidateEntityLists()]:::mth
  N10304 --> N10306
  N10307[generateQueryKey()]:::mth
  N10304 --> N10307
  N10308[invalidatePagination()]:::mth
  N10304 --> N10308
  N10309[File: session-cache.service.ts]:::file
  N9983 --> N10309
  N10310[Class: SessionCacheService]:::cls
  N10309 --> N10310
  N10311[setSession()]:::mth
  N10310 --> N10311
  N10312[getSession()]:::mth
  N10310 --> N10312
  N10313[refreshSession()]:::mth
  N10310 --> N10313
  N10314[deleteSession()]:::mth
  N10310 --> N10314
  N10315[deleteUserSessions()]:::mth
  N10310 --> N10315
  N10316[File: chat.controller.ts]:::file
  N9983 --> N10316
  N10317[Class: ChatController]:::cls
  N10316 --> N10317
  N10318[File: chat.module.ts]:::file
  N9983 --> N10318
  N10319[Class: ChatModule]:::cls
  N10318 --> N10319
  N10320[File: chat.service.ts]:::file
  N9983 --> N10320
  N10321[Class: ChatService]:::cls
  N10320 --> N10321
  N10322[getChatHistory()]:::mth
  N10321 --> N10322
  N10323[addMessage()]:::mth
  N10321 --> N10323
  N10324[clearChatHistory()]:::mth
  N10321 --> N10324
  N10325[File: app-config.module.ts]:::file
  N9983 --> N10325
  N10326[Class: AppConfigModule]:::cls
  N10325 --> N10326
  N10327[someMethod()]:::mth
  N10326 --> N10327
  N10329[File: app-config.service.ts]:::file
  N9983 --> N10329
  N10330[Class: AppConfigService]:::cls
  N10329 --> N10330
  N10331[onModuleInit()]:::mth
  N10330 --> N10331
  N10332[validateSecret()]:::mth
  N10330 --> N10332
  N10333[validateRequired()]:::mth
  N10330 --> N10333
  N10334[validateProductionConfig()]:::mth
  N10330 --> N10334
  N10335[ensureValidated()]:::mth
  N10330 --> N10335
  N10341[File: core.module.ts]:::file
  N9983 --> N10341
  N10342[Class: CoreModule]:::cls
  N10341 --> N10342
  N10346[File: create-agent.dto.ts]:::file
  N9983 --> N10346
  N10347[Class: AgentCapabilityDto]:::cls
  N10346 --> N10347
  N10348[Class: CreateAgentDto]:::cls
  N10346 --> N10348
  N10351[File: login.dto.ts]:::file
  N9983 --> N10351
  N10352[Class: LoginDto]:::cls
  N10351 --> N10352
  N10353[File: register.dto.ts]:::file
  N9983 --> N10353
  N10354[Class: RegisterDto]:::cls
  N10353 --> N10354
  N10355[File: update-agent.dto.ts]:::file
  N9983 --> N10355
  N10356[Class: UpdateAgentDto]:::cls
  N10355 --> N10356
  N10357[File: event-bus.service.ts]:::file
  N9983 --> N10357
  N10358[Class: that]:::cls
  N10357 --> N10358
  N10359[subscribe()]:::mth
  N10358 --> N10359
  N10360[unsubscribe()]:::mth
  N10358 --> N10360
  N10361[publish()]:::mth
  N10358 --> N10361
  N10362[Class: BaseEvent]:::cls
  N10357 --> N10362
  N10363[subscribe()]:::mth
  N10362 --> N10363
  N10364[unsubscribe()]:::mth
  N10362 --> N10364
  N10365[publish()]:::mth
  N10362 --> N10365
  N10366[Class: EventBus]:::cls
  N10357 --> N10366
  N10367[subscribe()]:::mth
  N10366 --> N10367
  N10368[unsubscribe()]:::mth
  N10366 --> N10368
  N10369[publish()]:::mth
  N10366 --> N10369
  N10370[File: feature.module.ts]:::file
  N9983 --> N10370
  N10371[Class: FeatureModule]:::cls
  N10370 --> N10371
  N10373[File: all-exceptions.filter.ts]:::file
  N9983 --> N10373
  N10374[Class: AllExceptionsFilter]:::cls
  N10373 --> N10374
  N10375[File: agent-communication.gateway.ts]:::file
  N9983 --> N10375
  N10376[Class: AgentCommunicationGateway]:::cls
  N10375 --> N10376
  N10377[afterInit()]:::mth
  N10376 --> N10377
  N10378[handleConnection()]:::mth
  N10376 --> N10378
  N10379[handleDisconnect()]:::mth
  N10376 --> N10379
  N10380[setupRedisSubscriptions()]:::mth
  N10376 --> N10380
  N10381[File: agent-communication.module.ts]:::file
  N9983 --> N10381
  N10382[Class: AgentCommunicationModule]:::cls
  N10381 --> N10382
  N10383[File: authGuard.ts]:::file
  N9983 --> N10383
  N10384[Class: AuthGuard]:::cls
  N10383 --> N10384
  N10385[canActivate()]:::mth
  N10384 --> N10385
  N10386[File: redis.health.ts]:::file
  N9983 --> N10386
  N10387[Class: RedisHealthIndicator]:::cls
  N10386 --> N10387
  N10388[isHealthy()]:::mth
  N10387 --> N10388
  N10390[File: cache.interceptor.ts]:::file
  N9983 --> N10390
  N10391[Class: CacheInterceptor]:::cls
  N10390 --> N10391
  N10392[intercept()]:::mth
  N10391 --> N10392
  N10393[File: compression.interceptor.ts]:::file
  N9983 --> N10393
  N10394[Class: CompressionInterceptor]:::cls
  N10393 --> N10394
  N10395[intercept()]:::mth
  N10394 --> N10395
  N10396[File: etag.interceptor.ts]:::file
  N9983 --> N10396
  N10397[Class: ETagInterceptor]:::cls
  N10396 --> N10397
  N10398[intercept()]:::mth
  N10397 --> N10398
  N10400[File: performance.interceptor.ts]:::file
  N9983 --> N10400
  N10401[Class: PerformanceInterceptor]:::cls
  N10400 --> N10401
  N10402[intercept()]:::mth
  N10401 --> N10402
  N10403[logPerformance()]:::mth
  N10401 --> N10403
  N10406[File: jobs-monitoring.controller.ts]:::file
  N9983 --> N10406
  N10407[Class: JobsMonitoringController]:::cls
  N10406 --> N10407
  N10408[getStatistics()]:::mth
  N10407 --> N10408
  N10409[getAllQueueMetrics()]:::mth
  N10407 --> N10409
  N10410[getDashboard()]:::mth
  N10407 --> N10410
  N10412[File: jobs.module.ts]:::file
  N9983 --> N10412
  N10413[Class: JobsModule]:::cls
  N10412 --> N10413
  N10414[File: agent-execution.processor.ts]:::file
  N9983 --> N10414
  N10415[Class: AgentExecutionProcessor]:::cls
  N10414 --> N10415
  N10416[handleExecuteAgent()]:::mth
  N10415 --> N10416
  N10417[handleBatchExecuteAgents()]:::mth
  N10415 --> N10417
  N10418[onActive()]:::mth
  N10415 --> N10418
  N10419[onCompleted()]:::mth
  N10415 --> N10419
  N10420[onFailed()]:::mth
  N10415 --> N10420
  N10421[File: cleanup.processor.ts]:::file
  N9983 --> N10421
  N10422[Class: CleanupProcessor]:::cls
  N10421 --> N10422
  N10423[handleCleanup()]:::mth
  N10422 --> N10423
  N10424[cleanupOldSessions()]:::mth
  N10422 --> N10424
  N10425[cleanupTempFiles()]:::mth
  N10422 --> N10425
  N10426[cleanupExpiredTokens()]:::mth
  N10422 --> N10426
  N10427[cleanupOldLogs()]:::mth
  N10422 --> N10427
  N10428[File: data-sync.processor.ts]:::file
  N9983 --> N10428
  N10429[Class: DataSyncProcessor]:::cls
  N10428 --> N10429
  N10430[handleSyncData()]:::mth
  N10429 --> N10430
  N10431[handleIncrementalSync()]:::mth
  N10429 --> N10431
  N10432[validateSyncConfig()]:::mth
  N10429 --> N10432
  N10433[fetchDataFromSource()]:::mth
  N10429 --> N10433
  N10434[fetchFromDatabase()]:::mth
  N10429 --> N10434
  N10435[File: email.processor.ts]:::file
  N9983 --> N10435
  N10436[Class: EmailProcessor]:::cls
  N10435 --> N10436
  N10437[handleSendEmail()]:::mth
  N10436 --> N10437
  N10438[handleWelcomeEmail()]:::mth
  N10436 --> N10438
  N10439[handleNotificationEmail()]:::mth
  N10436 --> N10439
  N10440[onActive()]:::mth
  N10436 --> N10440
  N10441[onCompleted()]:::mth
  N10436 --> N10441
  N10443[File: report-generation.processor.ts]:::file
  N9983 --> N10443
  N10444[Class: ReportGenerationProcessor]:::cls
  N10443 --> N10444
  N10445[handleGenerateReport()]:::mth
  N10444 --> N10445
  N10446[handleScheduledReport()]:::mth
  N10444 --> N10446
  N10447[generateUserActivityReport()]:::mth
  N10444 --> N10447
  N10448[generateAgentPerformanceReport()]:::mth
  N10444 --> N10448
  N10449[COUNT()]:::mth
  N10444 --> N10449
  N10450[File: graceful-shutdown.service.ts]:::file
  N9983 --> N10450
  N10451[Class: GracefulShutdownService]:::cls
  N10450 --> N10451
  N10452[onModuleDestroy()]:::mth
  N10451 --> N10452
  N10453[registerSignalHandlers()]:::mth
  N10451 --> N10453
  N10454[shutdown()]:::mth
  N10451 --> N10454
  N10455[pauseAllQueues()]:::mth
  N10451 --> N10455
  N10456[waitForActiveJobs()]:::mth
  N10451 --> N10456
  N10457[File: job-metrics.service.ts]:::file
  N9983 --> N10457
  N10458[Class: JobMetricsService]:::cls
  N10457 --> N10458
  N10459[getQueueMetrics()]:::mth
  N10458 --> N10459
  N10460[getAllQueueMetrics()]:::mth
  N10458 --> N10460
  N10461[getJobStatistics()]:::mth
  N10458 --> N10461
  N10462[getFailedJobs()]:::mth
  N10458 --> N10462
  N10463[getActiveJobs()]:::mth
  N10458 --> N10463
  N10464[File: job-queue.service.ts]:::file
  N9983 --> N10464
  N10465[Class: JobQueueService]:::cls
  N10464 --> N10465
  N10466[sendEmail()]:::mth
  N10465 --> N10466
  N10467[sendWelcomeEmail()]:::mth
  N10465 --> N10467
  N10468[sendNotificationEmail()]:::mth
  N10465 --> N10468
  N10469[executeAgent()]:::mth
  N10465 --> N10469
  N10470[executeBatchAgents()]:::mth
  N10465 --> N10470
  N10471[File: job-scheduler.service.ts]:::file
  N9983 --> N10471
  N10472[Class: JobSchedulerService]:::cls
  N10471 --> N10472
  N10473[onModuleInit()]:::mth
  N10472 --> N10473
  N10474[scheduleSessionCleanup()]:::mth
  N10472 --> N10474
  N10475[scheduleTempFilesCleanup()]:::mth
  N10472 --> N10475
  N10476[scheduleTokenCleanup()]:::mth
  N10472 --> N10476
  N10477[scheduleLogCleanup()]:::mth
  N10472 --> N10477
  N10482[File: loggingMiddleware.ts]:::file
  N9983 --> N10482
  N10483[Class: LoggingMiddleware]:::cls
  N10482 --> N10483
  N10484[toBufferChunk()]:::mth
  N10483 --> N10484
  N10485[use()]:::mth
  N10483 --> N10485
  N10486[sanitizeHeaders()]:::mth
  N10483 --> N10486
  N10487[File: request-logger.middleware.ts]:::file
  N9983 --> N10487
  N10488[Class: RequestLoggerMiddleware]:::cls
  N10487 --> N10488
  N10489[use()]:::mth
  N10488 --> N10489
  N10491[File: validationMiddleware.ts]:::file
  N9983 --> N10491
  N10492[Class: ValidationMiddleware]:::cls
  N10491 --> N10492
  N10493[use()]:::mth
  N10492 --> N10493
  N10494[File: admin.module.ts]:::file
  N9983 --> N10494
  N10495[Class: AdminModule]:::cls
  N10494 --> N10495
  N10496[File: admin-agents.controller.ts]:::file
  N9983 --> N10496
  N10497[Class: AdminAgentsController]:::cls
  N10496 --> N10497
  N10498[getAgentStats()]:::mth
  N10497 --> N10498
  N10499[File: admin-audit-logs.controller.ts]:::file
  N9983 --> N10499
  N10500[Class: AdminAuditLogsController]:::cls
  N10499 --> N10500
  N10501[Number()]:::mth
  N10500 --> N10501
  N10502[File: admin-backup.controller.ts]:::file
  N9983 --> N10502
  N10503[Class: AdminBackupController]:::cls
  N10502 --> N10503
  N10504[getBackups()]:::mth
  N10503 --> N10504
  N10505[getSchedules()]:::mth
  N10503 --> N10505
  N10506[createBackup()]:::mth
  N10503 --> N10506
  N10507[File: admin-config.controller.ts]:::file
  N9983 --> N10507
  N10508[Class: AdminConfigController]:::cls
  N10507 --> N10508
  N10509[getAllConfigs()]:::mth
  N10508 --> N10509
  N10510[File: admin-dashboard.controller.ts]:::file
  N9983 --> N10510
  N10511[Class: AdminDashboardController]:::cls
  N10510 --> N10511
  N10512[getDashboardMetrics()]:::mth
  N10511 --> N10512
  N10513[File: admin-database.controller.ts]:::file
  N9983 --> N10513
  N10514[Class: AdminDatabaseController]:::cls
  N10513 --> N10514
  N10515[getStats()]:::mth
  N10514 --> N10515
  N10516[File: admin-metrics.controller.ts]:::file
  N9983 --> N10516
  N10517[Class: AdminMetricsController]:::cls
  N10516 --> N10517
  N10518[Date()]:::mth
  N10517 --> N10518
  N10519[File: admin-settings.controller.ts]:::file
  N9983 --> N10519
  N10520[Class: AdminSettingsController]:::cls
  N10519 --> N10520
  N10521[getSettings()]:::mth
  N10520 --> N10521
  N10522[File: admin-users.controller.ts]:::file
  N9983 --> N10522
  N10523[Class: AdminUsersController]:::cls
  N10522 --> N10523
  N10524[File: agent.controller.ts]:::file
  N9983 --> N10524
  N10525[Class: AgentController]:::cls
  N10524 --> N10525
  N10526[File: agent.module.ts]:::file
  N9983 --> N10526
  N10527[Class: AgentModule]:::cls
  N10526 --> N10527
  N10528[File: agent.service.ts]:::file
  N9983 --> N10528
  N10529[Class: AgentService]:::cls
  N10528 --> N10529
  N10530[transformAgent()]:::mth
  N10529 --> N10530
  N10531[createAgent()]:::mth
  N10529 --> N10531
  N10532[getAgents()]:::mth
  N10529 --> N10532
  N10533[getAgentById()]:::mth
  N10529 --> N10533
  N10534[updateAgent()]:::mth
  N10529 --> N10534
  N10535[File: search-agent.dto.ts]:::file
  N9983 --> N10535
  N10536[Class: SearchAgentDto]:::cls
  N10535 --> N10536
  N10538[File: agent-executions.controller.ts]:::file
  N9983 --> N10538
  N10539[Class: AgentExecutionsController]:::cls
  N10538 --> N10539
  N10540[File: agent-executions.module.ts]:::file
  N9983 --> N10540
  N10541[Class: AgentExecutionsModule]:::cls
  N10540 --> N10541
  N10542[File: agent-executions.service.ts]:::file
  N9983 --> N10542
  N10543[Class: AgentExecutionsService]:::cls
  N10542 --> N10543
  N10544[findAll()]:::mth
  N10543 --> N10544
  N10545[findOne()]:::mth
  N10543 --> N10545
  N10546[File: agent-execution.dto.ts]:::file
  N9983 --> N10546
  N10547[Class: AgentExecutionQueryDto]:::cls
  N10546 --> N10547
  N10548[Class: AgentExecutionResponseDto]:::cls
  N10546 --> N10548
  N10549[Class: AgentExecutionListResponseDto]:::cls
  N10546 --> N10549
  N10550[File: agent-registry.controller.ts]:::file
  N9983 --> N10550
  N10551[Class: AgentRegistryController]:::cls
  N10550 --> N10551
  N10552[getOrientationSteps()]:::mth
  N10551 --> N10552
  N10553[getOrientationSummary()]:::mth
  N10551 --> N10553
  N10554[Number()]:::mth
  N10551 --> N10554
  N10555[getDirectoryStats()]:::mth
  N10551 --> N10555
  N10556[Date()]:::mth
  N10551 --> N10556
  N10557[File: agent-registry.module.ts]:::file
  N9983 --> N10557
  N10558[Class: AgentRegistryModule]:::cls
  N10557 --> N10558
  N10559[File: agent-directory.dto.ts]:::file
  N9983 --> N10559
  N10560[Class: SearchAgentsDto]:::cls
  N10559 --> N10560
  N10561[Class: AgentDirectoryEntryDto]:::cls
  N10559 --> N10561
  N10562[Class: AgentDirectoryResponseDto]:::cls
  N10559 --> N10562
  N10563[File: agent-registration-response.dto.ts]:::file
  N9983 --> N10563
  N10564[Class: AgentRegistrationResponseDto]:::cls
  N10563 --> N10564
  N10565[Class: WelcomeMessageDto]:::cls
  N10563 --> N10565
  N10567[File: register-agent.dto.ts]:::file
  N9983 --> N10567
  N10568[Class: AgentCapabilityDto]:::cls
  N10567 --> N10568
  N10569[Class: RegisterAgentDto]:::cls
  N10567 --> N10569
  N10570[File: trait-screen.dto.ts]:::file
  N9983 --> N10570
  N10571[Class: TraitScreenRequestDto]:::cls
  N10570 --> N10571
  N10572[File: sample-agent.ts]:::file
  N9983 --> N10572
  N10573[Class: SelfRegisteringAgent]:::cls
  N10572 --> N10573
  N10574[initialize()]:::mth
  N10573 --> N10574
  N10575[register()]:::mth
  N10573 --> N10575
  N10576[startOnboarding()]:::mth
  N10573 --> N10576
  N10577[testCapabilities()]:::mth
  N10573 --> N10577
  N10578[completeOrientation()]:::mth
  N10573 --> N10578
  N10581[File: agent-directory.service.ts]:::file
  N9983 --> N10581
  N10582[Class: AgentDirectoryService]:::cls
  N10581 --> N10582
  N10583[rows()]:::mth
  N10582 --> N10583
  N10584[normalizeMetadata()]:::mth
  N10582 --> N10584
  N10585[normalizeCategoryValue()]:::mth
  N10582 --> N10585
  N10586[extractNormalizedCategories()]:::mth
  N10582 --> N10586
  N10587[extractClassification()]:::mth
  N10582 --> N10587
  N10588[File: agent-onboarding.service.ts]:::file
  N9983 --> N10588
  N10589[Class: AgentOnboardingService]:::cls
  N10588 --> N10589
  N10590[startOnboarding()]:::mth
  N10589 --> N10590
  N10591[testCapabilities()]:::mth
  N10589 --> N10591
  N10592[completeStep()]:::mth
  N10589 --> N10592
  N10593[getOnboardingProgress()]:::mth
  N10589 --> N10593
  N10594[runCapabilityTest()]:::mth
  N10589 --> N10594
  N10595[File: agent-orientation.service.ts]:::file
  N9983 --> N10595
  N10596[Class: AgentOrientationService]:::cls
  N10595 --> N10596
  N10597[getOrientationSteps()]:::mth
  N10596 --> N10597
  N10598[getOrientationStep()]:::mth
  N10596 --> N10598
  N10599[getOrientationSummary()]:::mth
  N10596 --> N10599
  N10600[getWelcomeContent()]:::mth
  N10596 --> N10600
  N10601[getArchitectureContent()]:::mth
  N10596 --> N10601
  N10602[File: agent-profile-vector.service.ts]:::file
  N9983 --> N10602
  N10603[Class: AgentProfileVectorService]:::cls
  N10602 --> N10603
  N10604[rows()]:::mth
  N10603 --> N10604
  N10605[collectionSql()]:::mth
  N10603 --> N10605
  N10606[sanitizeIdentifier()]:::mth
  N10603 --> N10606
  N10607[getDefaultDimension()]:::mth
  N10603 --> N10607
  N10608[normalizeStringArray()]:::mth
  N10603 --> N10608
  N10609[File: agent-registration.service.ts]:::file
  N9983 --> N10609
  N10610[Class: AgentRegistrationService]:::cls
  N10609 --> N10610
  N10611[registerAgent()]:::mth
  N10610 --> N10611
  N10612[verifyAuthToken()]:::mth
  N10610 --> N10612
  N10613[updateHeartbeat()]:::mth
  N10610 --> N10613
  N10614[getRegistration()]:::mth
  N10610 --> N10614
  N10615[generateAuthToken()]:::mth
  N10610 --> N10615
  N10616[File: agent-registry-import.service.ts]:::file
  N9983 --> N10616
  N10617[Class: AgentRegistryImportService]:::cls
  N10616 --> N10617
  N10618[getRepoRoot()]:::mth
  N10617 --> N10618
  N10619[resolveSnapshotPath()]:::mth
  N10617 --> N10619
  N10620[normalizeArray()]:::mth
  N10617 --> N10620
  N10621[mergeUnique()]:::mth
  N10617 --> N10621
  N10622[normalizeAccessLevel()]:::mth
  N10617 --> N10622
  N10624[File: audit-logs.module.ts]:::file
  N9983 --> N10624
  N10625[Class: AuditLogsModule]:::cls
  N10624 --> N10625
  N10626[File: audit-logs.service.ts]:::file
  N9983 --> N10626
  N10627[Class: AuditLogsService]:::cls
  N10626 --> N10627
  N10628[create()]:::mth
  N10627 --> N10628
  N10629[findAll()]:::mth
  N10627 --> N10629
  N10630[findById()]:::mth
  N10627 --> N10630
  N10631[getStatistics()]:::mth
  N10627 --> N10631
  N10632[File: configuration.module.ts]:::file
  N9983 --> N10632
  N10633[Class: ConfigurationModule]:::cls
  N10632 --> N10633
  N10634[File: configuration.service.ts]:::file
  N9983 --> N10634
  N10635[Class: ConfigurationService]:::cls
  N10634 --> N10635
  N10636[findAllConfigs()]:::mth
  N10635 --> N10636
  N10637[findConfigByKey()]:::mth
  N10635 --> N10637
  N10638[updateConfig()]:::mth
  N10635 --> N10638
  N10639[getAdminSettings()]:::mth
  N10635 --> N10639
  N10640[updateAdminSettings()]:::mth
  N10635 --> N10640
  N10641[File: feedback.controller.ts]:::file
  N9983 --> N10641
  N10642[Class: CreateFeedbackDto]:::cls
  N10641 --> N10642
  N10643[getStats()]:::mth
  N10642 --> N10643
  N10644[Class: UpdateFeedbackDto]:::cls
  N10641 --> N10644
  N10645[getStats()]:::mth
  N10644 --> N10645
  N10646[Class: FeedbackQueryDto]:::cls
  N10641 --> N10646
  N10647[getStats()]:::mth
  N10646 --> N10647
  N10648[Class: FeedbackController]:::cls
  N10641 --> N10648
  N10649[getStats()]:::mth
  N10648 --> N10649
  N10650[File: feedback.entity.ts]:::file
  N9983 --> N10650
  N10651[Class: Feedback]:::cls
  N10650 --> N10651
  N10652[File: feedback.module.ts]:::file
  N9983 --> N10652
  N10653[Class: FeedbackModule]:::cls
  N10652 --> N10653
  N10654[File: feedback.service.ts]:::file
  N9983 --> N10654
  N10655[Class: FeedbackService]:::cls
  N10654 --> N10655
  N10656[create()]:::mth
  N10655 --> N10656
  N10657[findAll()]:::mth
  N10655 --> N10657
  N10658[findById()]:::mth
  N10655 --> N10658
  N10659[getStats()]:::mth
  N10655 --> N10659
  N10660[File: file.dto.ts]:::file
  N9983 --> N10660
  N10661[Class: FileUploadResponseDto]:::cls
  N10660 --> N10661
  N10662[Class: FileListQueryDto]:::cls
  N10660 --> N10662
  N10663[Class: FileListResponseDto]:::cls
  N10660 --> N10663
  N10665[File: files.controller.ts]:::file
  N9983 --> N10665
  N10666[Class: FilesController]:::cls
  N10665 --> N10666
  N10667[File: files.module.ts]:::file
  N9983 --> N10667
  N10668[Class: FilesModule]:::cls
  N10667 --> N10668
  N10669[File: files.service.ts]:::file
  N9983 --> N10669
  N10670[Class: FilesService]:::cls
  N10669 --> N10670
  N10671[initializeMockFiles()]:::mth
  N10670 --> N10671
  N10672[uploadFile()]:::mth
  N10670 --> N10672
  N10673[findAll()]:::mth
  N10670 --> N10673
  N10674[findOne()]:::mth
  N10670 --> N10674
  N10675[delete()]:::mth
  N10670 --> N10675
  N10676[File: aggregate.service.ts]:::file
  N9983 --> N10676
  N10677[Class: AggregateService]:::cls
  N10676 --> N10677
  N10678[execute()]:::mth
  N10677 --> N10678
  N10679[File: custom-agent.service.ts]:::file
  N9983 --> N10679
  N10680[Class: CustomAgentService]:::cls
  N10679 --> N10680
  N10681[execute()]:::mth
  N10680 --> N10681
  N10682[File: debate.service.ts]:::file
  N9983 --> N10682
  N10683[Class: DebateService]:::cls
  N10682 --> N10683
  N10684[execute()]:::mth
  N10683 --> N10684
  N10685[File: mass-blocks.service.ts]:::file
  N9983 --> N10685
  N10686[Class: MassBlocksService]:::cls
  N10685 --> N10686
  N10687[executeBlock()]:::mth
  N10686 --> N10687
  N10688[executeAggregate()]:::mth
  N10686 --> N10688
  N10689[executeReflect()]:::mth
  N10686 --> N10689
  N10690[executeDebate()]:::mth
  N10686 --> N10690
  N10691[executeCustom()]:::mth
  N10686 --> N10691
  N10692[Class: AggregateBlock]:::cls
  N10685 --> N10692
  N10693[executeBlock()]:::mth
  N10692 --> N10693
  N10694[executeAggregate()]:::mth
  N10692 --> N10694
  N10695[executeReflect()]:::mth
  N10692 --> N10695
  N10696[executeDebate()]:::mth
  N10692 --> N10696
  N10697[executeCustom()]:::mth
  N10692 --> N10697
  N10698[Class: ReflectBlock]:::cls
  N10685 --> N10698
  N10699[executeBlock()]:::mth
  N10698 --> N10699
  N10700[executeAggregate()]:::mth
  N10698 --> N10700
  N10701[executeReflect()]:::mth
  N10698 --> N10701
  N10702[executeDebate()]:::mth
  N10698 --> N10702
  N10703[executeCustom()]:::mth
  N10698 --> N10703
  N10704[Class: DebateBlock]:::cls
  N10685 --> N10704
  N10705[executeBlock()]:::mth
  N10704 --> N10705
  N10706[executeAggregate()]:::mth
  N10704 --> N10706
  N10707[executeReflect()]:::mth
  N10704 --> N10707
  N10708[executeDebate()]:::mth
  N10704 --> N10708
  N10709[executeCustom()]:::mth
  N10704 --> N10709
  N10710[Class: CustomBlock]:::cls
  N10685 --> N10710
  N10711[executeBlock()]:::mth
  N10710 --> N10711
  N10712[executeAggregate()]:::mth
  N10710 --> N10712
  N10713[executeReflect()]:::mth
  N10710 --> N10713
  N10714[executeDebate()]:::mth
  N10710 --> N10714
  N10715[executeCustom()]:::mth
  N10710 --> N10715
  N10716[Class: ToolUseBlock]:::cls
  N10685 --> N10716
  N10717[executeBlock()]:::mth
  N10716 --> N10717
  N10718[executeAggregate()]:::mth
  N10716 --> N10718
  N10719[executeReflect()]:::mth
  N10716 --> N10719
  N10720[executeDebate()]:::mth
  N10716 --> N10720
  N10721[executeCustom()]:::mth
  N10716 --> N10721
  N10722[Class: AgentExecutorService]:::cls
  N10685 --> N10722
  N10723[executeBlock()]:::mth
  N10722 --> N10723
  N10724[executeAggregate()]:::mth
  N10722 --> N10724
  N10725[executeReflect()]:::mth
  N10722 --> N10725
  N10726[executeDebate()]:::mth
  N10722 --> N10726
  N10727[executeCustom()]:::mth
  N10722 --> N10727
  N10728[File: reflect.service.ts]:::file
  N9983 --> N10728
  N10729[Class: ReflectService]:::cls
  N10728 --> N10729
  N10730[execute()]:::mth
  N10729 --> N10730
  N10731[File: tool-use.service.ts]:::file
  N9983 --> N10731
  N10732[Class: ToolUseService]:::cls
  N10731 --> N10732
  N10733[execute()]:::mth
  N10732 --> N10733
  N10734[File: mass-orchestration.service.ts]:::file
  N9983 --> N10734
  N10735[Class: MassOrchestrationService]:::cls
  N10734 --> N10735
  N10736[optimizeAgentPrompt()]:::mth
  N10735 --> N10736
  N10737[optimizeWorkflowTopology()]:::mth
  N10735 --> N10737
  N10738[optimizeWorkflowPrompts()]:::mth
  N10735 --> N10738
  N10739[runFullMassOptimization()]:::mth
  N10735 --> N10739
  N10740[createOptimizedAgent()]:::mth
  N10735 --> N10740
  N10741[File: mass.controller.ts]:::file
  N9983 --> N10741
  N10742[Class: MassController]:::cls
  N10741 --> N10742
  N10743[File: mass.module.ts]:::file
  N9983 --> N10743
  N10744[Class: MassModule]:::cls
  N10743 --> N10744
  N10745[File: prompt-optimizer.service.ts]:::file
  N9983 --> N10745
  N10746[Class: LlmInteractionService]:::cls
  N10745 --> N10746
  N10747[generateText()]:::mth
  N10746 --> N10747
  N10748[executeAgent()]:::mth
  N10746 --> N10748
  N10749[evaluatePrompt()]:::mth
  N10746 --> N10749
  N10750[evaluateTopology()]:::mth
  N10746 --> N10750
  N10751[executeTopology()]:::mth
  N10746 --> N10751
  N10752[Class: EvaluationHarnessService]:::cls
  N10745 --> N10752
  N10753[generateText()]:::mth
  N10752 --> N10753
  N10754[executeAgent()]:::mth
  N10752 --> N10754
  N10755[evaluatePrompt()]:::mth
  N10752 --> N10755
  N10756[evaluateTopology()]:::mth
  N10752 --> N10756
  N10757[executeTopology()]:::mth
  N10752 --> N10757
  N10758[Class: PromptOptimizerService]:::cls
  N10745 --> N10758
  N10759[generateText()]:::mth
  N10758 --> N10759
  N10760[executeAgent()]:::mth
  N10758 --> N10760
  N10761[evaluatePrompt()]:::mth
  N10758 --> N10761
  N10762[evaluateTopology()]:::mth
  N10758 --> N10762
  N10763[executeTopology()]:::mth
  N10758 --> N10763
  N10764[File: topology-optimizer.service.ts]:::file
  N9983 --> N10764
  N10765[Class: TopologyOptimizerService]:::cls
  N10764 --> N10765
  N10766[optimizeTopology()]:::mth
  N10765 --> N10766
  N10767[getOptimizedAgents()]:::mth
  N10765 --> N10767
  N10768[calculateInfluenceScores()]:::mth
  N10765 --> N10768
  N10769[getLatestPrompt()]:::mth
  N10765 --> N10769
  N10770[generateCandidateTopologies()]:::mth
  N10765 --> N10770
  N10771[File: workflow-prompt-optimizer.service.ts]:::file
  N9983 --> N10771
  N10772[Class: WorkflowPromptOptimizerService]:::cls
  N10771 --> N10772
  N10773[optimizeWorkflowPrompts()]:::mth
  N10772 --> N10773
  N10774[getTopology()]:::mth
  N10772 --> N10774
  N10775[getValidationDataset()]:::mth
  N10772 --> N10775
  N10776[optimizePromptsInContext()]:::mth
  N10772 --> N10776
  N10777[optimizeNodePromptInWorkflow()]:::mth
  N10772 --> N10777
  N10778[File: admin-mcp.controller.ts]:::file
  N9983 --> N10778
  N10779[Class: AdminMCPController]:::cls
  N10778 --> N10779
  N10780[listServers()]:::mth
  N10779 --> N10780
  N10781[getServersStatus()]:::mth
  N10779 --> N10781
  N10782[listClients()]:::mth
  N10779 --> N10782
  N10783[getClientsStatus()]:::mth
  N10779 --> N10783
  N10784[File: api-integration-agent.ts]:::file
  N9983 --> N10784
  N10785[Class: APIIntegrationAgent]:::cls
  N10784 --> N10785
  N10786[fetchExternalData()]:::mth
  N10785 --> N10786
  N10787[processAndShare()]:::mth
  N10785 --> N10787
  N10788[findAgentByCapability()]:::mth
  N10785 --> N10788
  N10789[requestDataTransformation()]:::mth
  N10785 --> N10789
  N10790[waitForTaskCompletion()]:::mth
  N10785 --> N10790
  N10791[File: coordinator-agent.ts]:::file
  N9983 --> N10791
  N10792[Class: CoordinatorAgent]:::cls
  N10791 --> N10792
  N10793[coordinateWorkflow()]:::mth
  N10792 --> N10793
  N10794[discoverAgents()]:::mth
  N10792 --> N10794
  N10795[createWorkflow()]:::mth
  N10792 --> N10795
  N10796[assignTasks()]:::mth
  N10792 --> N10796
  N10797[startCollaboration()]:::mth
  N10792 --> N10797
  N10798[File: data-processing-agent.ts]:::file
  N9983 --> N10798
  N10799[Class: DataProcessingAgent]:::cls
  N10798 --> N10799
  N10800[setupMessageHandlers()]:::mth
  N10799 --> N10800
  N10801[handleTaskAssignment()]:::mth
  N10799 --> N10801
  N10802[executeTask()]:::mth
  N10799 --> N10802
  N10803[transformData()]:::mth
  N10799 --> N10803
  N10804[validateData()]:::mth
  N10799 --> N10804
  N10806[File: multi-agent-coordination.ts]:::file
  N9983 --> N10806
  N10807[Class: AnalyticsAgent]:::cls
  N10806 --> N10807
  N10808[analyzeData()]:::mth
  N10807 --> N10808
  N10809[generateReport()]:::mth
  N10807 --> N10809
  N10810[runMultiAgentCoordination()]:::mth
  N10807 --> N10810
  N10811[pipelineProcessing()]:::mth
  N10807 --> N10811
  N10812[parallelProcessing()]:::mth
  N10807 --> N10812
  N10813[Class: ReporterAgent]:::cls
  N10806 --> N10813
  N10814[analyzeData()]:::mth
  N10813 --> N10814
  N10815[generateReport()]:::mth
  N10813 --> N10815
  N10816[runMultiAgentCoordination()]:::mth
  N10813 --> N10816
  N10817[pipelineProcessing()]:::mth
  N10813 --> N10817
  N10818[parallelProcessing()]:::mth
  N10813 --> N10818
  N10819[Class: AdvancedCoordinationPatterns]:::cls
  N10806 --> N10819
  N10820[analyzeData()]:::mth
  N10819 --> N10820
  N10821[generateReport()]:::mth
  N10819 --> N10821
  N10822[runMultiAgentCoordination()]:::mth
  N10819 --> N10822
  N10823[pipelineProcessing()]:::mth
  N10819 --> N10823
  N10824[parallelProcessing()]:::mth
  N10819 --> N10824
  N10825[File: mcp-a2a-bridge.service.ts]:::file
  N9983 --> N10825
  N10826[Class: MCPA2ABridge]:::cls
  N10825 --> N10826
  N10827[initializeBridge()]:::mth
  N10826 --> N10827
  N10828[registerA2AAgent()]:::mth
  N10826 --> N10828
  N10829[unregisterA2AAgent()]:::mth
  N10826 --> N10829
  N10830[routeA2AToMCP()]:::mth
  N10826 --> N10830
  N10831[routeMCPToA2A()]:::mth
  N10826 --> N10831
  N10832[File: mcp-api.controller.ts]:::file
  N9983 --> N10832
  N10833[Class: McpApiController]:::cls
  N10832 --> N10833
  N10834[mapRegistryServerResponse()]:::mth
  N10833 --> N10834
  N10835[fetchRegistryServers()]:::mth
  N10833 --> N10835
  N10836[fetchRegistryServerResponses()]:::mth
  N10833 --> N10836
  N10837[mapRegistryToApiServer()]:::mth
  N10833 --> N10837
  N10838[buildRegistryConfigurationSchema()]:::mth
  N10833 --> N10838
  N10839[File: mcp-server.service.ts]:::file
  N9983 --> N10839
  N10840[Class: MCPServerService]:::cls
  N10839 --> N10840
  N10841[onModuleInit()]:::mth
  N10840 --> N10841
  N10842[onModuleDestroy()]:::mth
  N10840 --> N10842
  N10843[startServer()]:::mth
  N10840 --> N10843
  N10844[stopServer()]:::mth
  N10840 --> N10844
  N10845[registerTools()]:::mth
  N10840 --> N10845
  N10846[File: mcp-tool-registry.service.ts]:::file
  N9983 --> N10846
  N10847[Class: MCPToolRegistry]:::cls
  N10846 --> N10847
  N10848[registerAllTools()]:::mth
  N10847 --> N10848
  N10849[registerProtocolTools()]:::mth
  N10847 --> N10849
  N10850[registerWorkflowTools()]:::mth
  N10847 --> N10850
  N10851[registerTaskTools()]:::mth
  N10847 --> N10851
  N10852[registerAgentTools()]:::mth
  N10847 --> N10852
  N10853[File: mcp.controller.ts]:::file
  N9983 --> N10853
  N10854[Class: MCPController]:::cls
  N10853 --> N10854
  N10855[getStatus()]:::mth
  N10854 --> N10855
  N10856[getServers()]:::mth
  N10854 --> N10856
  N10857[getBridgeStats()]:::mth
  N10854 --> N10857
  N10858[getToolGroups()]:::mth
  N10854 --> N10858
  N10859[File: mcp.module.ts]:::file
  N9983 --> N10859
  N10860[Class: MCPModule]:::cls
  N10859 --> N10860
  N10862[File: AgentLifecycleManager.ts]:::file
  N9983 --> N10862
  N10863[Class: AgentLifecycleManager]:::cls
  N10862 --> N10863
  N10864[registerAgent()]:::mth
  N10863 --> N10864
  N10865[spawnAgent()]:::mth
  N10863 --> N10865
  N10866[checkAllAgentsHealth()]:::mth
  N10863 --> N10866
  N10867[monitorInboxHealth()]:::mth
  N10863 --> N10867
  N10868[handleAgentFailure()]:::mth
  N10863 --> N10868
  N10870[File: orchestrator.controller.ts]:::file
  N9983 --> N10870
  N10871[Class: OrchestratorController]:::cls
  N10870 --> N10871
  N10872[getSystemHealth()]:::mth
  N10871 --> N10872
  N10873[getAllAgents()]:::mth
  N10871 --> N10873
  N10874[String()]:::mth
  N10871 --> N10874
  N10875[getTNFStatus()]:::mth
  N10871 --> N10875
  N10876[File: orchestrator.module.ts]:::file
  N9983 --> N10876
  N10877[Class: OrchestratorModule]:::cls
  N10876 --> N10877
  N10878[File: orchestrator.service.ts]:::file
  N9983 --> N10878
  N10879[Class: HeartbeatMonitoringService]:::cls
  N10878 --> N10879
  N10880[start()]:::mth
  N10879 --> N10880
  N10881[stop()]:::mth
  N10879 --> N10881
  N10882[registerAgent()]:::mth
  N10879 --> N10882
  N10883[recordHeartbeat()]:::mth
  N10879 --> N10883
  N10884[recordActivity()]:::mth
  N10879 --> N10884
  N10885[Class: OrchestratorService]:::cls
  N10878 --> N10885
  N10886[start()]:::mth
  N10885 --> N10886
  N10887[stop()]:::mth
  N10885 --> N10887
  N10888[registerAgent()]:::mth
  N10885 --> N10888
  N10889[recordHeartbeat()]:::mth
  N10885 --> N10889
  N10890[recordActivity()]:::mth
  N10885 --> N10890
  N10891[File: user-bots.controller.ts]:::file
  N9983 --> N10891
  N10892[Class: UserBotsController]:::cls
  N10891 --> N10892
  N10893[File: user-bots.module.ts]:::file
  N9983 --> N10893
  N10894[Class: UserBotsModule]:::cls
  N10893 --> N10894
  N10895[File: user-bots.service.ts]:::file
  N9983 --> N10895
  N10896[Class: UserBotsService]:::cls
  N10895 --> N10896
  N10897[getBots()]:::mth
  N10896 --> N10897
  N10898[createBot()]:::mth
  N10896 --> N10898
  N10899[updateBot()]:::mth
  N10896 --> N10899
  N10900[deleteBot()]:::mth
  N10896 --> N10900
  N10901[File: redis.module.ts]:::file
  N9983 --> N10901
  N10902[Class: RedisModule]:::cls
  N10901 --> N10902
  N10904[File: relay.controller.ts]:::file
  N9983 --> N10904
  N10905[Class: RelayController]:::cls
  N10904 --> N10905
  N10906[health()]:::mth
  N10905 --> N10906
  N10907[status()]:::mth
  N10905 --> N10907
  N10908[config()]:::mth
  N10905 --> N10908
  N10909[restart()]:::mth
  N10905 --> N10909
  N10910[File: relay.gateway.ts]:::file
  N9983 --> N10910
  N10911[Class: RelayGateway]:::cls
  N10910 --> N10911
  N10912[afterInit()]:::mth
  N10911 --> N10912
  N10913[handleConnection()]:::mth
  N10911 --> N10913
  N10914[handleDisconnect()]:::mth
  N10911 --> N10914
  N10915[handleStatusRequest()]:::mth
  N10911 --> N10915
  N10916[handleRelayMessage()]:::mth
  N10911 --> N10916
  N10917[File: relay.module.ts]:::file
  N9983 --> N10917
  N10918[Class: RelayModule]:::cls
  N10917 --> N10918
  N10922[File: relay.service.ts]:::file
  N9983 --> N10922
  N10923[Class: RelayService]:::cls
  N10922 --> N10923
  N10924[buildConfig()]:::mth
  N10923 --> N10924
  N10925[onModuleInit()]:::mth
  N10923 --> N10925
  N10926[onModuleDestroy()]:::mth
  N10923 --> N10926
  N10927[loadRelayCore()]:::mth
  N10923 --> N10927
  N10928[startRelayServer()]:::mth
  N10923 --> N10928
  N10929[File: self-improvement-cron.service.ts]:::file
  N9983 --> N10929
  N10930[Class: SelfImprovementCronService]:::cls
  N10929 --> N10930
  N10931[Daily()]:::mth
  N10930 --> N10931
  N10932[healthMonitoring()]:::mth
  N10930 --> N10932
  N10933[patternExtraction()]:::mth
  N10930 --> N10933
  N10934[dailySelfImprovement()]:::mth
  N10930 --> N10934
  N10935[weeklyMetaAnalysis()]:::mth
  N10930 --> N10935
  N10936[File: self-improvement.module.ts]:::file
  N9983 --> N10936
  N10937[Class: SelfImprovementModule]:::cls
  N10936 --> N10937
  N10938[File: shared-state.controller.ts]:::file
  N9983 --> N10938
  N10939[Class: SharedStateController]:::cls
  N10938 --> N10939
  N10940[checkHealth()]:::mth
  N10939 --> N10940
  N10941[File: shared-state.module.ts]:::file
  N9983 --> N10941
  N10942[Class: SharedStateModule]:::cls
  N10941 --> N10942
  N10943[File: shared-state.service.ts]:::file
  N9983 --> N10943
  N10944[Class: SharedStateService]:::cls
  N10943 --> N10944
  N10945[headers()]:::mth
  N10944 --> N10945
  N10946[deposit()]:::mth
  N10944 --> N10946
  N10947[getContext()]:::mth
  N10944 --> N10947
  N10948[checkHealth()]:::mth
  N10944 --> N10948
  N10950[File: system-metrics.dto.ts]:::file
  N9983 --> N10950
  N10951[Class: MemoryMetricsDto]:::cls
  N10950 --> N10951
  N10952[Class: CpuMetricsDto]:::cls
  N10950 --> N10952
  N10953[Class: DatabaseMetricsDto]:::cls
  N10950 --> N10953
  N10954[Class: ApiMetricsDto]:::cls
  N10950 --> N10954
  N10955[Class: ServiceHealthDto]:::cls
  N10950 --> N10955
  N10956[Class: SystemMetricsResponseDto]:::cls
  N10950 --> N10956
  N10958[File: system-metrics.controller.ts]:::file
  N9983 --> N10958
  N10959[Class: SystemMetricsController]:::cls
  N10958 --> N10959
  N10960[getMetrics()]:::mth
  N10959 --> N10960
  N10961[getHealth()]:::mth
  N10959 --> N10961
  N10962[File: system-metrics.module.ts]:::file
  N9983 --> N10962
  N10963[Class: SystemMetricsModule]:::cls
  N10962 --> N10963
  N10964[File: system-metrics.service.ts]:::file
  N9983 --> N10964
  N10965[Class: SystemMetricsService]:::cls
  N10964 --> N10965
  N10966[getMetrics()]:::mth
  N10965 --> N10966
  N10967[getMemoryMetrics()]:::mth
  N10965 --> N10967
  N10968[getCpuMetrics()]:::mth
  N10965 --> N10968
  N10969[getDiskMetrics()]:::mth
  N10965 --> N10969
  N10970[getNetworkMetrics()]:::mth
  N10965 --> N10970
  N10971[File: workflow-template.dto.ts]:::file
  N9983 --> N10971
  N10972[Class: CreateWorkflowTemplateDto]:::cls
  N10971 --> N10972
  N10973[Class: UpdateWorkflowTemplateDto]:::cls
  N10971 --> N10973
  N10974[Class: WorkflowTemplateResponseDto]:::cls
  N10971 --> N10974
  N10976[File: workflow-templates.controller.ts]:::file
  N9983 --> N10976
  N10977[Class: WorkflowTemplatesController]:::cls
  N10976 --> N10977
  N10978[findAll()]:::mth
  N10977 --> N10978
  N10979[File: workflow-templates.module.ts]:::file
  N9983 --> N10979
  N10980[Class: WorkflowTemplatesModule]:::cls
  N10979 --> N10980
  N10981[File: workflow-templates.service.ts]:::file
  N9983 --> N10981
  N10982[Class: WorkflowTemplatesService]:::cls
  N10981 --> N10982
  N10983[initializeMockTemplates()]:::mth
  N10982 --> N10983
  N10984[findAll()]:::mth
  N10982 --> N10984
  N10985[findOne()]:::mth
  N10982 --> N10985
  N10986[create()]:::mth
  N10982 --> N10986
  N10987[update()]:::mth
  N10982 --> N10987
  N10989[File: monitoring.controller.ts]:::file
  N9983 --> N10989
  N10990[Class: MonitoringController]:::cls
  N10989 --> N10990
  N10991[getHealth()]:::mth
  N10990 --> N10991
  N10992[File: performance-metrics.controller.ts]:::file
  N9983 --> N10992
  N10993[Class: PerformanceMetricsController]:::cls
  N10992 --> N10993
  N10994[getMetrics()]:::mth
  N10993 --> N10994
  N10995[getMetricsJson()]:::mth
  N10993 --> N10995
  N10996[getCurrentMetrics()]:::mth
  N10993 --> N10996
  N10997[File: performance-metrics.module.ts]:::file
  N9983 --> N10997
  N10998[Class: PerformanceMetricsModule]:::cls
  N10997 --> N10998
  N10999[File: performance-metrics.service.ts]:::file
  N9983 --> N10999
  N11000[Class: PerformanceMetricsService]:::cls
  N10999 --> N11000
  N11001[recordHttpRequest()]:::mth
  N11000 --> N11001
  N11002[recordHttpError()]:::mth
  N11000 --> N11002
  N11003[incrementRequestsInFlight()]:::mth
  N11000 --> N11003
  N11004[decrementRequestsInFlight()]:::mth
  N11000 --> N11004
  N11005[recordDbQuery()]:::mth
  N11000 --> N11005
  N11006[File: n8n-integration.controller.ts]:::file
  N9983 --> N11006
  N11007[Class: N8nIntegrationController]:::cls
  N11006 --> N11007
  N11008[getNodeTypes()]:::mth
  N11007 --> N11008
  N11009[File: n8n-metadata.service.ts]:::file
  N9983 --> N11009
  N11010[Class: N8nMetadataService]:::cls
  N11009 --> N11010
  N11011[getAllNodeTypes()]:::mth
  N11010 --> N11011
  N11012[getNodeTypeDescription()]:::mth
  N11010 --> N11012
  N11013[getCredentialTypes()]:::mth
  N11010 --> N11013
  N11014[File: n8n.module.ts]:::file
  N9983 --> N11014
  N11015[Class: N8nModule]:::cls
  N11014 --> N11015
  N11016[File: workflow.validator.ts]:::file
  N9983 --> N11016
  N11017[Class: WorkflowValidator]:::cls
  N11016 --> N11017
  N11018[validate()]:::mth
  N11017 --> N11018
  N11019[validateNodeParameters()]:::mth
  N11017 --> N11019
  N11020[validateNodeCredentials()]:::mth
  N11017 --> N11020
  N11021[validateConnections()]:::mth
  N11017 --> N11021
  N11022[isValidConnection()]:::mth
  N11017 --> N11022
  N11023[File: notification.events.ts]:::file
  N9983 --> N11023
  N11024[Class: NotificationSentEvent]:::cls
  N11023 --> N11024
  N11025[Class: NotificationReadEvent]:::cls
  N11023 --> N11025
  N11026[Class: NotificationDeletedEvent]:::cls
  N11023 --> N11026
  N11027[File: notification.service.ts]:::file
  N9983 --> N11027
  N11028[Class: NotificationService]:::cls
  N11027 --> N11028
  N11029[sendNotification()]:::mth
  N11028 --> N11029
  N11030[sendMultiChannelNotification()]:::mth
  N11028 --> N11030
  N11031[sendSlackNotification()]:::mth
  N11028 --> N11031
  N11032[sendEmailNotification()]:::mth
  N11028 --> N11032
  N11033[sendWebhookNotification()]:::mth
  N11028 --> N11033
  N11034[File: profile.events.ts]:::file
  N9983 --> N11034
  N11035[Class: ProfileUpdatedEvent]:::cls
  N11034 --> N11035
  N11036[Class: AvatarUpdatedEvent]:::cls
  N11034 --> N11036
  N11037[Class: ProfileCreatedEvent]:::cls
  N11034 --> N11037
  N11038[File: profile.service.ts]:::file
  N9983 --> N11038
  N11039[Class: ProfileService]:::cls
  N11038 --> N11039
  N11040[getProfile()]:::mth
  N11039 --> N11040
  N11041[updateProfile()]:::mth
  N11039 --> N11041
  N11042[updateAvatar()]:::mth
  N11039 --> N11042
  N11043[enrichUserProfile()]:::mth
  N11039 --> N11043
  N11044[File: redis-streams.service.ts]:::file
  N9983 --> N11044
  N11045[Class: RedisStreamsService]:::cls
  N11044 --> N11045
  N11046[onModuleInit()]:::mth
  N11045 --> N11046
  N11047[onModuleDestroy()]:::mth
  N11045 --> N11047
  N11048[initializeRedisConnections()]:::mth
  N11045 --> N11048
  N11049[setupDefaultStreams()]:::mth
  N11045 --> N11049
  N11050[publishToStream()]:::mth
  N11045 --> N11050
  N11051[File: CostOptimizedRouter.ts]:::file
  N9983 --> N11051
  N11052[Class: CostOptimizedRouter]:::cls
  N11051 --> N11052
  N11053[initializeAgentCostRegistry()]:::mth
  N11052 --> N11053
  N11054[routeTask()]:::mth
  N11052 --> N11054
  N11055[findCapableAgents()]:::mth
  N11052 --> N11055
  N11056[calculateCostEffectiveness()]:::mth
  N11052 --> N11056
  N11057[match()]:::mth
  N11052 --> N11057
  N11059[File: roo-coder-client.ts]:::file
  N9983 --> N11059
  N11060[Class: RooCoderClient]:::cls
  N11059 --> N11060
  N11061[initialize()]:::mth
  N11060 --> N11061
  N11062[handleMessage()]:::mth
  N11060 --> N11062
  N11063[sendAcknowledgment()]:::mth
  N11060 --> N11063
  N11064[sendTaskRequest()]:::mth
  N11060 --> N11064
  N11065[sendCodeReview()]:::mth
  N11060 --> N11065
  N11067[File: test-agent-communication.ts]:::file
  N9983 --> N11067
  N11068[Class: AgentCommunicationTester]:::cls
  N11067 --> N11068
  N11069[initialize()]:::mth
  N11068 --> N11069
  N11070[handleMessage()]:::mth
  N11068 --> N11070
  N11071[sendInitialInstructions()]:::mth
  N11068 --> N11071
  N11072[handleTaskRequest()]:::mth
  N11068 --> N11072
  N11073[cleanup()]:::mth
  N11068 --> N11073
  N11074[File: test-agent-coordinator.ts]:::file
  N9983 --> N11074
  N11075[Class: MockFeatureTracker]:::cls
  N11074 --> N11075
  N11076[track()]:::mth
  N11075 --> N11076
  N11077[testCoordinator()]:::mth
  N11075 --> N11077
  N11078[example()]:::mth
  N11075 --> N11078
  N11080[File: trae-agent-client.ts]:::file
  N9983 --> N11080
  N11081[Class: TraeAgentClient]:::cls
  N11080 --> N11081
  N11082[setupEventHandlers()]:::mth
  N11081 --> N11082
  N11083[initialize()]:::mth
  N11081 --> N11083
  N11084[sendInitialHandshake()]:::mth
  N11081 --> N11084
  N11085[handleMessage()]:::mth
  N11081 --> N11085
  N11086[handleSystemMessage()]:::mth
  N11081 --> N11086
  N11087[File: trae-agent.ts]:::file
  N9983 --> N11087
  N11088[Class: TraeAgent]:::cls
  N11087 --> N11088
  N11089[initialize()]:::mth
  N11088 --> N11089
  N11090[verifySystemRequirements()]:::mth
  N11088 --> N11090
  N11091[registerAgent()]:::mth
  N11088 --> N11091
  N11092[setupCommunication()]:::mth
  N11088 --> N11092
  N11093[sendInitialHandshake()]:::mth
  N11088 --> N11093
  N11095[File: agent-coordinator.ts]:::file
  N9983 --> N11095
  N11096[Class: AgentCoordinator]:::cls
  N11095 --> N11096
  N11097[handleMessage()]:::mth
  N11096 --> N11097
  N11098[findBestAgent()]:::mth
  N11096 --> N11098
  N11099[handleResponse()]:::mth
  N11096 --> N11099
  N11100[dispatchToAgent()]:::mth
  N11096 --> N11100
  N11101[analyzeMessageRequirements()]:::mth
  N11096 --> N11101
  N11102[File: enhanced-agent.ts]:::file
  N9983 --> N11102
  N11103[Class: EnhancedAgent]:::cls
  N11102 --> N11103
  N11104[initialize()]:::mth
  N11103 --> N11104
  N11105[publish()]:::mth
  N11103 --> N11105
  N11106[cleanup()]:::mth
  N11103 --> N11106
  N11107[File: trae-agent.ts]:::file
  N9983 --> N11107
  N11108[Class: TraeAgent]:::cls
  N11107 --> N11108
  N11109[setupSubscriptions()]:::mth
  N11108 --> N11109
  N11110[setupErrorHandling()]:::mth
  N11108 --> N11110
  N11111[handleMessage()]:::mth
  N11108 --> N11111
  N11112[publishMessage()]:::mth
  N11108 --> N11112
  N11113[handleError()]:::mth
  N11108 --> N11113
  N11114[File: trae-monitor.ts]:::file
  N9983 --> N11114
  N11115[Class: TraeMonitor]:::cls
  N11114 --> N11115
  N11116[initialize()]:::mth
  N11115 --> N11116
  N11117[startHeartbeat()]:::mth
  N11115 --> N11117
  N11118[sendHeartbeat()]:::mth
  N11115 --> N11118
  N11119[enableMetrics()]:::mth
  N11115 --> N11119
  N11120[recordMetric()]:::mth
  N11115 --> N11120
  N11121[File: trae.module.ts]:::file
  N9983 --> N11121
  N11122[Class: TraeAgentModule]:::cls
  N11121 --> N11122
  N11123[File: agent-communication.service.ts]:::file
  N9983 --> N11123
  N11124[Class: AgentCommunicationService]:::cls
  N11123 --> N11124
  N11125[broadcastMessage()]:::mth
  N11124 --> N11125
  N11126[sendDirectMessage()]:::mth
  N11124 --> N11126
  N11127[File: agent.service.ts]:::file
  N9983 --> N11127
  N11128[Class: AgentService]:::cls
  N11127 --> N11128
  N11129[createAgent()]:::mth
  N11128 --> N11129
  N11130[getAgents()]:::mth
  N11128 --> N11130
  N11131[getAgentById()]:::mth
  N11128 --> N11131
  N11132[updateAgentStatus()]:::mth
  N11128 --> N11132
  N11133[updateAgent()]:::mth
  N11128 --> N11133
  N11134[File: auction-relayer.service.ts]:::file
  N9983 --> N11134
  N11135[Class: AuctionRelayerService]:::cls
  N11134 --> N11135
  N11136[relayBid()]:::mth
  N11135 --> N11136
  N11137[File: blockchain-util.service.ts]:::file
  N9983 --> N11137
  N11138[Class: BlockchainUtilService]:::cls
  N11137 --> N11138
  N11139[initializeProvider()]:::mth
  N11138 --> N11139
  N11140[estimateGas()]:::mth
  N11138 --> N11140
  N11141[sendTransaction()]:::mth
  N11138 --> N11141
  N11142[waitForConfirmation()]:::mth
  N11138 --> N11142
  N11143[getNetworkInfo()]:::mth
  N11138 --> N11143
  N11144[File: email.service.ts]:::file
  N9983 --> N11144
  N11145[Class: EmailService]:::cls
  N11144 --> N11145
  N11146[sendEmail()]:::mth
  N11145 --> N11146
  N11147[sendNotificationEmail()]:::mth
  N11145 --> N11147
  N11148[File: identity.service.ts]:::file
  N9983 --> N11148
  N11149[Class: IdentityService]:::cls
  N11148 --> N11149
  N11150[generateMachineLabel()]:::mth
  N11149 --> N11150
  N11151[mintMachineID()]:::mth
  N11149 --> N11151
  N11152[File: logging.service.ts]:::file
  N9983 --> N11152
  N11153[Class: LoggingService]:::cls
  N11152 --> N11153
  N11154[setContext()]:::mth
  N11153 --> N11154
  N11155[log()]:::mth
  N11153 --> N11155
  N11156[error()]:::mth
  N11153 --> N11156
  N11157[warn()]:::mth
  N11153 --> N11157
  N11158[debug()]:::mth
  N11153 --> N11158
  N11161[File: production-blockchain.service.ts]:::file
  N9983 --> N11161
  N11162[Class: ProductionBlockchainService]:::cls
  N11161 --> N11162
  N11163[createAgentNFT()]:::mth
  N11162 --> N11163
  N11164[validateAgentNFTCreation()]:::mth
  N11162 --> N11164
  N11165[generateMetadataURI()]:::mth
  N11162 --> N11165
  N11166[getAgentNFTABI()]:::mth
  N11162 --> N11166
  N11167[updateAgentNFTMetadata()]:::mth
  N11162 --> N11167
  N11169[File: redis-lock.service.ts]:::file
  N9983 --> N11169
  N11170[Class: RedisLockService]:::cls
  N11169 --> N11170
  N11171[onModuleInit()]:::mth
  N11170 --> N11171
  N11172[onModuleDestroy()]:::mth
  N11170 --> N11172
  N11173[defineLuaScripts()]:::mth
  N11170 --> N11173
  N11174[generateLockId()]:::mth
  N11170 --> N11174
  N11175[acquireLock()]:::mth
  N11170 --> N11175
  N11176[File: redis.service.ts]:::file
  N9983 --> N11176
  N11177[Class: RedisService]:::cls
  N11176 --> N11177
  N11178[onModuleDestroy()]:::mth
  N11177 --> N11178
  N11179[get()]:::mth
  N11177 --> N11179
  N11180[set()]:::mth
  N11177 --> N11180
  N11181[del()]:::mth
  N11177 --> N11181
  N11182[exists()]:::mth
  N11177 --> N11182
  N11183[File: revenue-tracking.service.ts]:::file
  N9983 --> N11183
  N11184[Class: RevenueTrackingService]:::cls
  N11183 --> N11184
  N11185[trackRevenue()]:::mth
  N11184 --> N11185
  N11186[checkAndTriggerDistribution()]:::mth
  N11184 --> N11186
  N11187[distributeRevenue()]:::mth
  N11184 --> N11187
  N11188[scanForRevenueEvents()]:::mth
  N11184 --> N11188
  N11189[processRevenueEvents()]:::mth
  N11184 --> N11189
  N11190[File: smart-contract.service.ts]:::file
  N9983 --> N11190
  N11191[Class: SmartContractService]:::cls
  N11190 --> N11191
  N11192[initializeContracts()]:::mth
  N11191 --> N11192
  N11193[mintAgentNft()]:::mth
  N11191 --> N11193
  N11194[updateTokenMetadata()]:::mth
  N11191 --> N11194
  N11195[transferFractionalShare()]:::mth
  N11191 --> N11195
  N11196[listShares()]:::mth
  N11191 --> N11196
  N11197[File: storage.service.ts]:::file
  N9983 --> N11197
  N11198[Class: StorageService]:::cls
  N11197 --> N11198
  N11199[uploadFile()]:::mth
  N11198 --> N11199
  N11200[deleteFile()]:::mth
  N11198 --> N11200
  N11201[getSignedUrl()]:::mth
  N11198 --> N11201
  N11202[File: validation.service.ts]:::file
  N9983 --> N11202
  N11203[Class: ValidationService]:::cls
  N11202 --> N11203
  N11204[validateSchema()]:::mth
  N11203 --> N11204
  N11205[File: agent-inbox.ts]:::file
  N9983 --> N11205
  N11206[Class: AgentInbox]:::cls
  N11205 --> N11206
  N11207[create()]:::mth
  N11206 --> N11207
  N11208[getPendingTasks()]:::mth
  N11206 --> N11208
  N11209[getPendingCount()]:::mth
  N11206 --> N11209
  N11210[getInProgressTasks()]:::mth
  N11206 --> N11210
  N11211[receiveTask()]:::mth
  N11206 --> N11211
  N11212[File: simple-app.module.ts]:::file
  N9983 --> N11212
  N11213[Class: SimpleAppModule]:::cls
  N11212 --> N11213
  N11215[File: smoke-agent-registry.ts]:::file
  N9983 --> N11215
  N11216[Class: SmokeModule]:::cls
  N11215 --> N11216
  N11217[main()]:::mth
  N11216 --> N11217
  N11218[File: task.service.ts]:::file
  N9983 --> N11218
  N11219[Class: TaskService]:::cls
  N11218 --> N11219
  N11220[createTask()]:::mth
  N11219 --> N11220
  N11221[processTaskQueue()]:::mth
  N11219 --> N11221
  N11222[processTask()]:::mth
  N11219 --> N11222
  N11232[File: profile.dto.ts]:::file
  N9983 --> N11232
  N11233[Class: UpdateProfileDto]:::cls
  N11232 --> N11233
  N11234[Class: ProfileResponseDto]:::cls
  N11232 --> N11234
  N11235[File: user.dto.ts]:::file
  N9983 --> N11235
  N11236[Class: CreateUserDto]:::cls
  N11235 --> N11236
  N11237[Class: UpdateUserDto]:::cls
  N11235 --> N11237
  N11238[File: user.events.ts]:::file
  N9983 --> N11238
  N11239[Class: UserCreatedEvent]:::cls
  N11238 --> N11239
  N11240[Class: UserUpdatedEvent]:::cls
  N11238 --> N11240
  N11241[Class: UserDeletedEvent]:::cls
  N11238 --> N11241
  N11242[File: user.service.ts]:::file
  N9983 --> N11242
  N11243[Class: UsersService]:::cls
  N11242 --> N11243
  N11244[findOne()]:::mth
  N11243 --> N11244
  N11245[findByEmail()]:::mth
  N11243 --> N11245
  N11246[create()]:::mth
  N11243 --> N11246
  N11247[update()]:::mth
  N11243 --> N11247
  N11248[delete()]:::mth
  N11243 --> N11248
  N11250[File: users.controller.ts]:::file
  N9983 --> N11250
  N11251[Class: UsersController]:::cls
  N11250 --> N11251
  N11252[File: users.module.ts]:::file
  N9983 --> N11252
  N11253[Class: UsersModule]:::cls
  N11252 --> N11253
  N11254[File: users.service.ts]:::file
  N9983 --> N11254
  N11255[Class: UsersService]:::cls
  N11254 --> N11255
  N11256[create()]:::mth
  N11255 --> N11256
  N11257[findAll()]:::mth
  N11255 --> N11257
  N11258[findById()]:::mth
  N11255 --> N11258
  N11259[findByEmail()]:::mth
  N11255 --> N11259
  N11260[update()]:::mth
  N11255 --> N11260
  N11261[File: auth.utils.ts]:::file
  N9983 --> N11261
  N11262[Class: EnhancedAuthUtilsService]:::cls
  N11261 --> N11262
  N11263[hashPassword()]:::mth
  N11262 --> N11263
  N11264[comparePasswords()]:::mth
  N11262 --> N11264
  N11265[generateToken()]:::mth
  N11262 --> N11265
  N11266[verifyToken()]:::mth
  N11262 --> N11266
  N11267[validateUser()]:::mth
  N11262 --> N11267
  N11272[File: stream.ts]:::file
  N9983 --> N11272
  N11273[Class: StreamResponse]:::cls
  N11272 --> N11273
  N11274[write()]:::mth
  N11273 --> N11274
  N11275[end()]:::mth
  N11273 --> N11275
  N11277[File: workflow-execution.gateway.ts]:::file
  N9983 --> N11277
  N11278[Class: WorkflowExecutionGateway]:::cls
  N11277 --> N11278
  N11279[handleConnection()]:::mth
  N11278 --> N11279
  N11280[handleDisconnect()]:::mth
  N11278 --> N11280
  N11281[broadcastToExecution()]:::mth
  N11278 --> N11281
  N11282[sendExecutionUpdate()]:::mth
  N11278 --> N11282
  N11283[sendNodeStarted()]:::mth
  N11278 --> N11283
  N11284[File: workflow-execution.service.ts]:::file
  N9983 --> N11284
  N11285[Class: WorkflowExecutionService]:::cls
  N11284 --> N11285
  N11286[onModuleInit()]:::mth
  N11285 --> N11286
  N11287[execute()]:::mth
  N11285 --> N11287
  N11288[executeWorkflow()]:::mth
  N11285 --> N11288
  N11289[executeStep()]:::mth
  N11285 --> N11289
  N11290[executeAgentStep()]:::mth
  N11285 --> N11290
  N11291[File: workflow.controller.ts]:::file
  N9983 --> N11291
  N11292[Class: WorkflowController]:::cls
  N11291 --> N11292
  N11293[File: workflow.module.ts]:::file
  N9983 --> N11293
  N11294[Class: WorkflowModule]:::cls
  N11293 --> N11294
  N11295[casin8-games]:::pkg
  TNF --> N11295
  N11296[chrome-extension]:::pkg
  TNF --> N11296
  N11297[File: BaseAgent.ts]:::file
  N11296 --> N11297
  N11298[Class: BaseAgent]:::cls
  N11297 --> N11298
  N11299[process()]:::mth
  N11298 --> N11299
  N11300[store()]:::mth
  N11298 --> N11300
  N11301[retrieve()]:::mth
  N11298 --> N11301
  N11302[update()]:::mth
  N11298 --> N11302
  N11303[handleMessage()]:::mth
  N11298 --> N11303
  N11305[File: unstoppable-domains-auth.ts]:::file
  N11296 --> N11305
  N11306[Class: UnstoppableDomainsAuth]:::cls
  N11305 --> N11306
  N11307[loadConfig()]:::mth
  N11306 --> N11307
  N11308[loadSession()]:::mth
  N11306 --> N11308
  N11309[saveSession()]:::mth
  N11306 --> N11309
  N11310[configure()]:::mth
  N11306 --> N11310
  N11311[isAuthenticated()]:::mth
  N11306 --> N11311
  N11312[File: auth-manager.ts]:::file
  N11296 --> N11312
  N11313[Class: AuthManager]:::cls
  N11312 --> N11313
  N11314[initialize()]:::mth
  N11313 --> N11314
  N11315[loadTokens()]:::mth
  N11313 --> N11315
  N11316[Date()]:::mth
  N11313 --> N11316
  N11317[saveTokens()]:::mth
  N11313 --> N11317
  N11318[isTokenValid()]:::mth
  N11313 --> N11318
  N11319[File: background.ts]:::file
  N11296 --> N11319
  N11320[Class: HybridBackground]:::cls
  N11319 --> N11320
  N11321[getInstance()]:::mth
  N11320 --> N11321
  N11322[init()]:::mth
  N11320 --> N11322
  N11323[connectToTnf()]:::mth
  N11320 --> N11323
  N11324[connectToMcp()]:::mth
  N11320 --> N11324
  N11325[scheduleReconnect()]:::mth
  N11320 --> N11325
  N11326[File: browser-control-handler.ts]:::file
  N11296 --> N11326
  N11327[Class: BrowserControlHandler]:::cls
  N11326 --> N11327
  N11328[handleMessage()]:::mth
  N11327 --> N11328
  N11329[handleNavigate()]:::mth
  N11327 --> N11329
  N11330[listener()]:::mth
  N11327 --> N11330
  N11331[listener()]:::mth
  N11327 --> N11331
  N11332[handleGoBack()]:::mth
  N11327 --> N11332
  N11333[File: connection-manager.ts]:::file
  N11296 --> N11333
  N11334[Class: ConnectionManager]:::cls
  N11333 --> N11334
  N11335[initialize()]:::mth
  N11334 --> N11335
  N11336[loadSettings()]:::mth
  N11334 --> N11336
  N11337[saveSettings()]:::mth
  N11334 --> N11337
  N11338[connect()]:::mth
  N11334 --> N11338
  N11339[disconnect()]:::mth
  N11334 --> N11339
  N11341[File: message-handler.ts]:::file
  N11296 --> N11341
  N11342[Class: MessageHandler]:::cls
  N11341 --> N11342
  N11343[initialize()]:::mth
  N11342 --> N11343
  N11344[showNotification()]:::mth
  N11342 --> N11344
  N11345[File: screen-recording.ts]:::file
  N11296 --> N11345
  N11346[Class: ScreenRecordingService]:::cls
  N11345 --> N11346
  N11347[startRecording()]:::mth
  N11346 --> N11347
  N11348[stopRecording()]:::mth
  N11346 --> N11348
  N11349[isCurrentlyRecording()]:::mth
  N11346 --> N11349
  N11350[getStatus()]:::mth
  N11346 --> N11350
  N11351[captureTab()]:::mth
  N11346 --> N11351
  N11352[File: web3-interceptor.ts]:::file
  N11296 --> N11352
  N11353[Class: Web3Interceptor]:::cls
  N11352 --> N11353
  N11354[loadConfig()]:::mth
  N11353 --> N11354
  N11355[saveConfig()]:::mth
  N11353 --> N11355
  N11356[setEnabled()]:::mth
  N11353 --> N11356
  N11357[isEnabled()]:::mth
  N11353 --> N11357
  N11358[getConfig()]:::mth
  N11353 --> N11358
  N11359[File: background.ts]:::file
  N11296 --> N11359
  N11360[Class: TNFRelayConnection]:::cls
  N11359 --> N11360
  N11361[connect()]:::mth
  N11360 --> N11361
  N11362[getRelayConfig()]:::mth
  N11360 --> N11362
  N11363[attemptReconnect()]:::mth
  N11360 --> N11363
  N11364[sendRelayMessage()]:::mth
  N11360 --> N11364
  N11365[handleRelayMessage()]:::mth
  N11360 --> N11365
  N11367[File: ai-element-detector.ts]:::file
  N11296 --> N11367
  N11368[Class: AIElementDetector]:::cls
  N11367 --> N11368
  N11369[initializeChatPatterns()]:::mth
  N11368 --> N11369
  N11370[detectChatElements()]:::mth
  N11368 --> N11370
  N11371[findElementsByPattern()]:::mth
  N11368 --> N11371
  N11372[searchByTextPatterns()]:::mth
  N11368 --> N11372
  N11373[isRelevantTagForPattern()]:::mth
  N11368 --> N11373
  N11374[Class: combinations]:::cls
  N11367 --> N11374
  N11375[initializeChatPatterns()]:::mth
  N11374 --> N11375
  N11376[detectChatElements()]:::mth
  N11374 --> N11376
  N11377[findElementsByPattern()]:::mth
  N11374 --> N11377
  N11378[searchByTextPatterns()]:::mth
  N11374 --> N11378
  N11379[isRelevantTagForPattern()]:::mth
  N11374 --> N11379
  N11380[File: browser-control-handlers.ts]:::file
  N11296 --> N11380
  N11381[Class: BrowserControlContentHandlers]:::cls
  N11380 --> N11381
  N11382[detectPlatform()]:::mth
  N11381 --> N11382
  N11383[findElement()]:::mth
  N11381 --> N11383
  N11384[isVisible()]:::mth
  N11381 --> N11384
  N11385[getXPath()]:::mth
  N11381 --> N11385
  N11386[generateSelector()]:::mth
  N11381 --> N11386
  N11387[File: chat-integration-manager.ts]:::file
  N11296 --> N11387
  N11388[Class: ChatIntegrationManager]:::cls
  N11387 --> N11388
  N11389[initializePlatforms()]:::mth
  N11388 --> N11389
  N11390[initializeForCurrentPage()]:::mth
  N11388 --> N11390
  N11391[detectPlatform()]:::mth
  N11388 --> N11391
  N11392[initializeGenericChat()]:::mth
  N11388 --> N11392
  N11393[initializePlatformSpecific()]:::mth
  N11388 --> N11393
  N11394[File: element-selector.ts]:::file
  N11296 --> N11394
  N11395[Class: ElementSelector]:::cls
  N11394 --> N11395
  N11396[exitSelectionMode()]:::mth
  N11395 --> N11396
  N11397[getElementInfo()]:::mth
  N11395 --> N11397
  N11398[autoDetectChatElements()]:::mth
  N11395 --> N11398
  N11399[saveElementMapping()]:::mth
  N11395 --> N11399
  N11400[loadElementMapping()]:::mth
  N11395 --> N11400
  N11402[File: syntax-highlighter.ts]:::file
  N11296 --> N11402
  N11403[Class: if]:::cls
  N11402 --> N11403
  N11404[applySyntaxHighlighting()]:::mth
  N11403 --> N11404
  N11405[setupDarkModeSupport()]:::mth
  N11403 --> N11405
  N11406[updateTheme()]:::mth
  N11403 --> N11406
  N11408[File: logs-viewer.ts]:::file
  N11296 --> N11408
  N11409[Class: LogsViewer]:::cls
  N11408 --> N11409
  N11410[initialize()]:::mth
  N11409 --> N11410
  N11411[refreshLogs()]:::mth
  N11409 --> N11411
  N11412[filterLogs()]:::mth
  N11409 --> N11412
  N11413[updateLogsDisplay()]:::mth
  N11409 --> N11413
  N11414[clearLogs()]:::mth
  N11409 --> N11414
  N11415[File: settings-manager.ts]:::file
  N11296 --> N11415
  N11416[Class: DebugSettingsManager]:::cls
  N11415 --> N11416
  N11417[initialize()]:::mth
  N11416 --> N11417
  N11418[loadSettings()]:::mth
  N11416 --> N11418
  N11419[saveSettings()]:::mth
  N11416 --> N11419
  N11420[resetSettings()]:::mth
  N11416 --> N11420
  N11421[updateUI()]:::mth
  N11416 --> N11421
  N11422[File: websocket-tester.ts]:::file
  N11296 --> N11422
  N11423[Class: WebSocketTester]:::cls
  N11422 --> N11423
  N11424[connect()]:::mth
  N11423 --> N11424
  N11425[disconnect()]:::mth
  N11423 --> N11425
  N11426[send()]:::mth
  N11423 --> N11426
  N11427[logMessage()]:::mth
  N11423 --> N11427
  N11428[updateUI()]:::mth
  N11423 --> N11428
  N11429[File: FederationManager.ts]:::file
  N11296 --> N11429
  N11430[Class: FederationManager]:::cls
  N11429 --> N11430
  N11431[initialize()]:::mth
  N11430 --> N11431
  N11432[connectToRelay()]:::mth
  N11430 --> N11432
  N11433[registerWithRelay()]:::mth
  N11430 --> N11433
  N11434[handleRelayMessage()]:::mth
  N11430 --> N11434
  N11435[sendToRelay()]:::mth
  N11430 --> N11435
  N11436[File: RedisBridge.ts]:::file
  N11296 --> N11436
  N11437[Class: RedisBridge]:::cls
  N11436 --> N11437
  N11438[connect()]:::mth
  N11437 --> N11438
  N11439[disconnect()]:::mth
  N11437 --> N11439
  N11440[isConnectedToBridge()]:::mth
  N11437 --> N11440
  N11441[register()]:::mth
  N11437 --> N11441
  N11442[startHeartbeat()]:::mth
  N11437 --> N11442
  N11445[File: accessibility.ts]:::file
  N11296 --> N11445
  N11446[Class: AccessibilityManager]:::cls
  N11445 --> N11446
  N11447[loadSettings()]:::mth
  N11446 --> N11447
  N11448[saveSettings()]:::mth
  N11446 --> N11448
  N11449[detectSystemPreferences()]:::mth
  N11446 --> N11449
  N11450[setupSystemPreferenceListeners()]:::mth
  N11446 --> N11450
  N11451[applySettings()]:::mth
  N11446 --> N11451
  N11452[Class: to]:::cls
  N11445 --> N11452
  N11453[loadSettings()]:::mth
  N11452 --> N11453
  N11454[saveSettings()]:::mth
  N11452 --> N11454
  N11455[detectSystemPreferences()]:::mth
  N11452 --> N11455
  N11456[setupSystemPreferenceListeners()]:::mth
  N11452 --> N11456
  N11457[applySettings()]:::mth
  N11452 --> N11457
  N11458[Class: when]:::cls
  N11445 --> N11458
  N11459[loadSettings()]:::mth
  N11458 --> N11459
  N11460[saveSettings()]:::mth
  N11458 --> N11460
  N11461[detectSystemPreferences()]:::mth
  N11458 --> N11461
  N11462[setupSystemPreferenceListeners()]:::mth
  N11458 --> N11462
  N11463[applySettings()]:::mth
  N11458 --> N11463
  N11464[File: chat-manager.ts]:::file
  N11296 --> N11464
  N11465[Class: ChatManager]:::cls
  N11464 --> N11465
  N11466[initialize()]:::mth
  N11465 --> N11466
  N11467[loadMessages()]:::mth
  N11465 --> N11467
  N11468[saveMessages()]:::mth
  N11465 --> N11468
  N11469[sendMessage()]:::mth
  N11465 --> N11469
  N11470[addMessage()]:::mth
  N11465 --> N11470
  N11471[File: AgentNetworkPanel.ts]:::file
  N11296 --> N11471
  N11472[Class: AgentNetworkPanel]:::cls
  N11471 --> N11472
  N11473[setupListeners()]:::mth
  N11472 --> N11473
  N11474[connect()]:::mth
  N11472 --> N11474
  N11475[disconnect()]:::mth
  N11472 --> N11475
  N11476[sendMessage()]:::mth
  N11472 --> N11476
  N11477[render()]:::mth
  N11472 --> N11477
  N11478[File: connection-status.ts]:::file
  N11296 --> N11478
  N11479[Class: ConnectionStatusManager]:::cls
  N11478 --> N11479
  N11480[getConnectionState()]:::mth
  N11479 --> N11480
  N11481[updateStatus()]:::mth
  N11479 --> N11481
  N11482[updateUI()]:::mth
  N11479 --> N11482
  N11483[connect()]:::mth
  N11479 --> N11483
  N11484[disconnect()]:::mth
  N11479 --> N11484
  N11485[File: element-selection-manager.ts]:::file
  N11296 --> N11485
  N11486[Class: ElementSelectionManager]:::cls
  N11485 --> N11486
  N11487[initialize()]:::mth
  N11486 --> N11487
  N11488[updateLastActivity()]:::mth
  N11486 --> N11488
  N11489[enhancedLog()]:::mth
  N11486 --> N11489
  N11490[performEnhancedPlatformDetection()]:::mth
  N11486 --> N11490
  N11491[detectPlatformFromURL()]:::mth
  N11486 --> N11491
  N11492[File: header-connection.ts]:::file
  N11296 --> N11492
  N11493[Class: HeaderConnectionManager]:::cls
  N11492 --> N11493
  N11494[initialize()]:::mth
  N11493 --> N11494
  N11495[updateConnectionStatus()]:::mth
  N11493 --> N11495
  N11496[setConnectingState()]:::mth
  N11493 --> N11496
  N11499[File: tab-manager.ts]:::file
  N11296 --> N11499
  N11500[Class: TabManager]:::cls
  N11499 --> N11500
  N11501[initialize()]:::mth
  N11500 --> N11501
  N11502[setActiveTab()]:::mth
  N11500 --> N11502
  N11503[getActiveTab()]:::mth
  N11500 --> N11503
  N11504[updateUI()]:::mth
  N11500 --> N11504
  N11505[addTabChangeListener()]:::mth
  N11500 --> N11505
  N11506[File: theme-manager.ts]:::file
  N11296 --> N11506
  N11507[Class: ThemeManager]:::cls
  N11506 --> N11507
  N11508[setTheme()]:::mth
  N11507 --> N11508
  N11509[toggleTheme()]:::mth
  N11507 --> N11509
  N11510[getTheme()]:::mth
  N11507 --> N11510
  N11511[isDarkMode()]:::mth
  N11507 --> N11511
  N11512[applyTheme()]:::mth
  N11507 --> N11512
  N11513[File: theme.ts]:::file
  N11296 --> N11513
  N11514[Class: ThemeManager]:::cls
  N11513 --> N11514
  N11515[setTheme()]:::mth
  N11514 --> N11515
  N11516[getTheme()]:::mth
  N11514 --> N11516
  N11517[isDarkMode()]:::mth
  N11514 --> N11517
  N11518[applyTheme()]:::mth
  N11514 --> N11518
  N11519[addThemeChangeListener()]:::mth
  N11514 --> N11519
  N11520[File: BaseProcessor.ts]:::file
  N11296 --> N11520
  N11521[Class: for]:::cls
  N11520 --> N11521
  N11522[process()]:::mth
  N11521 --> N11522
  N11523[debug()]:::mth
  N11521 --> N11523
  N11524[logError()]:::mth
  N11521 --> N11524
  N11525[Class: BaseProcessor]:::cls
  N11520 --> N11525
  N11526[process()]:::mth
  N11525 --> N11526
  N11527[debug()]:::mth
  N11525 --> N11527
  N11528[logError()]:::mth
  N11525 --> N11528
  N11529[File: ApiClient.ts]:::file
  N11296 --> N11529
  N11530[Class: TheNewFuseApiClient]:::cls
  N11529 --> N11530
  N11531[loadConfig()]:::mth
  N11530 --> N11531
  N11532[authenticate()]:::mth
  N11530 --> N11532
  N11533[getAgents()]:::mth
  N11530 --> N11533
  N11534[createAgent()]:::mth
  N11530 --> N11534
  N11535[sendAgentMessage()]:::mth
  N11530 --> N11535
  N11538[File: setup.ts]:::file
  N11296 --> N11538
  N11539[Class: MockWebSocket]:::cls
  N11538 --> N11539
  N11540[send()]:::mth
  N11539 --> N11540
  N11541[close()]:::mth
  N11539 --> N11541
  N11545[File: websocket-manager.test.ts]:::file
  N11296 --> N11545
  N11546[Class: ErrorWebSocket]:::cls
  N11545 --> N11546
  N11547[close()]:::mth
  N11546 --> N11547
  N11548[send()]:::mth
  N11546 --> N11548
  N11551[File: ai-models.ts]:::file
  N11296 --> N11551
  N11552[Class: AIModelsManager]:::cls
  N11551 --> N11552
  N11553[handleMessage()]:::mth
  N11552 --> N11553
  N11554[handleModelsResponse()]:::mth
  N11552 --> N11554
  N11555[handleAIResponse()]:::mth
  N11552 --> N11555
  N11556[handleAIError()]:::mth
  N11552 --> N11556
  N11557[loadModels()]:::mth
  N11552 --> N11557
  N11558[File: code-snippets.ts]:::file
  N11296 --> N11558
  N11559[Class: CodeSnippetsManager]:::cls
  N11558 --> N11559
  N11560[loadSnippets()]:::mth
  N11559 --> N11560
  N11561[saveSnippets()]:::mth
  N11559 --> N11561
  N11562[addSnippet()]:::mth
  N11559 --> N11562
  N11563[updateSnippet()]:::mth
  N11559 --> N11563
  N11564[deleteSnippet()]:::mth
  N11559 --> N11564
  N11566[File: enhanced-theme.ts]:::file
  N11296 --> N11566
  N11567[Class: export]:::cls
  N11566 --> N11567
  N11568[generateThemeCSS()]:::mth
  N11567 --> N11568
  N11569[createMaterialUITheme()]:::mth
  N11567 --> N11569
  N11570[applyThemeToPage()]:::mth
  N11567 --> N11570
  N11571[detectSystemTheme()]:::mth
  N11567 --> N11571
  N11572[loadSavedTheme()]:::mth
  N11567 --> N11572
  N11573[Class: ThemeManager]:::cls
  N11566 --> N11573
  N11574[generateThemeCSS()]:::mth
  N11573 --> N11574
  N11575[createMaterialUITheme()]:::mth
  N11573 --> N11575
  N11576[applyThemeToPage()]:::mth
  N11573 --> N11576
  N11577[detectSystemTheme()]:::mth
  N11573 --> N11577
  N11578[loadSavedTheme()]:::mth
  N11573 --> N11578
  N11579[File: file-transfer.ts]:::file
  N11296 --> N11579
  N11580[Class: FileTransferManager]:::cls
  N11579 --> N11580
  N11581[isFileTransferMessage()]:::mth
  N11580 --> N11581
  N11582[isChunkAckMessage()]:::mth
  N11580 --> N11582
  N11583[isTransferCompleteMessage()]:::mth
  N11580 --> N11583
  N11584[isTransferErrorMessage()]:::mth
  N11580 --> N11584
  N11585[isTransferRequestMessage()]:::mth
  N11580 --> N11585
  N11586[File: floating-panel-manager.ts]:::file
  N11296 --> N11586
  N11587[Class: FloatingPanelManager]:::cls
  N11586 --> N11587
  N11588[initialize()]:::mth
  N11587 --> N11588
  N11589[createFloatingPanelIframe()]:::mth
  N11587 --> N11589
  N11590[makeDraggable()]:::mth
  N11587 --> N11590
  N11591[setupMessageListeners()]:::mth
  N11587 --> N11591
  N11592[show()]:::mth
  N11587 --> N11592
  N11594[File: logger.ts]:::file
  N11296 --> N11594
  N11595[Class: Logger]:::cls
  N11594 --> N11595
  N11596[shouldLog()]:::mth
  N11595 --> N11596
  N11597[formatMessage()]:::mth
  N11595 --> N11597
  N11598[writeLogEntry()]:::mth
  N11595 --> N11598
  N11599[debug()]:::mth
  N11595 --> N11599
  N11600[info()]:::mth
  N11595 --> N11600
  N11602[File: performance-optimizer.ts]:::file
  N11296 --> N11602
  N11603[Class: PerformanceOptimizer]:::cls
  N11602 --> N11603
  N11604[getInstance()]:::mth
  N11603 --> N11604
  N11605[getInitialMetrics()]:::mth
  N11603 --> N11605
  N11606[initialize()]:::mth
  N11603 --> N11606
  N11607[startMonitoring()]:::mth
  N11603 --> N11607
  N11608[stopMonitoring()]:::mth
  N11603 --> N11608
  N11609[File: rate-limiter.ts]:::file
  N11296 --> N11609
  N11610[Class: RateLimiter]:::cls
  N11609 --> N11610
  N11611[canMakeRequest()]:::mth
  N11610 --> N11611
  N11612[getTimeToNext()]:::mth
  N11610 --> N11612
  N11613[File: security.ts]:::file
  N11296 --> N11613
  N11614[Class: SecurityManager]:::cls
  N11613 --> N11614
  N11615[ensureKeyIsReady()]:::mth
  N11614 --> N11615
  N11616[setSharedSecret()]:::mth
  N11614 --> N11616
  N11617[loadSharedSecret()]:::mth
  N11614 --> N11617
  N11618[deriveKeyFromSecret()]:::mth
  N11614 --> N11618
  N11619[encryptMessage()]:::mth
  N11614 --> N11619
  N11620[File: settings-manager.ts]:::file
  N11296 --> N11620
  N11621[Class: SettingsManager]:::cls
  N11620 --> N11621
  N11622[getInstance()]:::mth
  N11621 --> N11622
  N11623[getDefaultSettings()]:::mth
  N11621 --> N11623
  N11624[initialize()]:::mth
  N11621 --> N11624
  N11625[loadSettings()]:::mth
  N11621 --> N11625
  N11626[saveSettings()]:::mth
  N11621 --> N11626
  N11627[File: store.ts]:::file
  N11296 --> N11627
  N11628[Class: for]:::cls
  N11627 --> N11628
  N11629[getInstance()]:::mth
  N11628 --> N11629
  N11630[resolve()]:::mth
  N11628 --> N11630
  N11631[Class: Store]:::cls
  N11627 --> N11631
  N11632[getInstance()]:::mth
  N11631 --> N11632
  N11633[resolve()]:::mth
  N11631 --> N11633
  N11634[File: tnf-message-formatter.ts]:::file
  N11296 --> N11634
  N11635[Class: TNFMessageFormatter]:::cls
  N11634 --> N11635
  N11636[formatForClaudeDesktop()]:::mth
  N11635 --> N11636
  N11637[formatElementDetection()]:::mth
  N11635 --> N11637
  N11638[formatConnectionStatus()]:::mth
  N11635 --> N11638
  N11639[detectPlatform()]:::mth
  N11635 --> N11639
  N11640[generateMessageId()]:::mth
  N11635 --> N11640
  N11642[File: websocket-manager.ts]:::file
  N11296 --> N11642
  N11643[Class: WebSocketManager]:::cls
  N11642 --> N11643
  N11644[getState()]:::mth
  N11643 --> N11644
  N11645[connect()]:::mth
  N11643 --> N11645
  N11646[setSecurityManager()]:::mth
  N11643 --> N11646
  N11647[send()]:::mth
  N11643 --> N11647
  N11648[disconnect()]:::mth
  N11643 --> N11648
  N11650[File: index.ts]:::file
  N11296 --> N11650
  N11651[Class: BackgroundService]:::cls
  N11650 --> N11651
  N11652[init()]:::mth
  N11651 --> N11652
  N11653[startCleanupTimer()]:::mth
  N11651 --> N11653
  N11654[tryInitialConnection()]:::mth
  N11651 --> N11654
  N11655[checkRelayHealth()]:::mth
  N11651 --> N11655
  N11656[getOrCreateAgentId()]:::mth
  N11651 --> N11656
  N11657[File: SimpleChatBridge.ts]:::file
  N11296 --> N11657
  N11658[Class: SimpleChatBridge]:::cls
  N11657 --> N11658
  N11659[isSupportedPlatform()]:::mth
  N11658 --> N11659
  N11660[init()]:::mth
  N11658 --> N11660
  N11661[findElements()]:::mth
  N11658 --> N11661
  N11662[input()]:::mth
  N11658 --> N11662
  N11663[button()]:::mth
  N11658 --> N11663
  N11664[File: SiteConfigs.ts]:::file
  N11296 --> N11664
  N11665[Class: while]:::cls
  N11664 --> N11665
  N11666[getSiteConfig()]:::mth
  N11665 --> N11666
  N11667[File: UniversalChatDetector.ts]:::file
  N11296 --> N11667
  N11668[Class: UniversalChatDetector]:::cls
  N11667 --> N11668
  N11669[startDetection()]:::mth
  N11668 --> N11669
  N11670[stopDetection()]:::mth
  N11668 --> N11670
  N11671[getElements()]:::mth
  N11668 --> N11671
  N11672[detectElements()]:::mth
  N11668 --> N11672
  N11673[findInputElement()]:::mth
  N11668 --> N11673
  N11675[File: index.ts]:::file
  N11296 --> N11675
  N11676[Class: FuseConnectContentScript]:::cls
  N11675 --> N11676
  N11677[init()]:::mth
  N11676 --> N11677
  N11678[setup()]:::mth
  N11676 --> N11678
  N11679[startChatDetection()]:::mth
  N11676 --> N11679
  N11680[setupDebugUtils()]:::mth
  N11676 --> N11680
  N11681[showPanel()]:::mth
  N11676 --> N11681
  N11682[File: FloatingPanel.ts]:::file
  N11296 --> N11682
  N11683[Class: EnhancedFloatingPanel]:::cls
  N11682 --> N11683
  N11684[startCleanupInterval()]:::mth
  N11683 --> N11684
  N11685[requestConnectionState()]:::mth
  N11683 --> N11685
  N11686[loadState()]:::mth
  N11683 --> N11686
  N11687[saveState()]:::mth
  N11683 --> N11687
  N11688[inject()]:::mth
  N11683 --> N11688
  N11689[Class: methods]:::cls
  N11682 --> N11689
  N11690[startCleanupInterval()]:::mth
  N11689 --> N11690
  N11691[requestConnectionState()]:::mth
  N11689 --> N11691
  N11692[loadState()]:::mth
  N11689 --> N11692
  N11693[saveState()]:::mth
  N11689 --> N11693
  N11694[inject()]:::mth
  N11689 --> N11694
  N11695[File: self-prompting.ts]:::file
  N11296 --> N11695
  N11696[Class: SelfPrompter]:::cls
  N11695 --> N11696
  N11697[updateActivity()]:::mth
  N11696 --> N11697
  N11698[enable()]:::mth
  N11696 --> N11698
  N11699[disable()]:::mth
  N11696 --> N11699
  N11700[checkAndPrompt()]:::mth
  N11696 --> N11700
  N11701[selectPrompt()]:::mth
  N11696 --> N11701
  N11702[File: AccessibilityTree.ts]:::file
  N11296 --> N11702
  N11703[Class: AccessibilityTreeGenerator]:::cls
  N11702 --> N11703
  N11704[generateTree()]:::mth
  N11703 --> N11704
  N11705[processElement()]:::mth
  N11703 --> N11705
  N11706[shouldIncludeElement()]:::mth
  N11703 --> N11706
  N11707[getRole()]:::mth
  N11703 --> N11707
  N11708[getLabel()]:::mth
  N11703 --> N11708
  N11709[File: AgentVisualIndicator.ts]:::file
  N11296 --> N11709
  N11710[Class: AgentVisualIndicator]:::cls
  N11709 --> N11710
  N11711[showAgentActive()]:::mth
  N11710 --> N11711
  N11712[hideAgentActive()]:::mth
  N11710 --> N11712
  N11713[showStaticIndicator()]:::mth
  N11710 --> N11713
  N11714[hideStaticIndicator()]:::mth
  N11710 --> N11714
  N11715[hideForToolUse()]:::mth
  N11710 --> N11715
  N11716[File: CaptchaHandler.ts]:::file
  N11296 --> N11716
  N11717[Class: CaptchaHandler]:::cls
  N11716 --> N11717
  N11718[detectCaptcha()]:::mth
  N11717 --> N11718
  N11719[attemptBypass()]:::mth
  N11717 --> N11719
  N11720[waitForCaptchaSolved()]:::mth
  N11717 --> N11720
  N11721[detectRecaptchaV2()]:::mth
  N11717 --> N11721
  N11722[detectRecaptchaV3()]:::mth
  N11717 --> N11722
  N11723[File: HumanBehaviorSimulator.ts]:::file
  N11296 --> N11723
  N11724[Class: HumanBehaviorSimulator]:::cls
  N11723 --> N11724
  N11725[randomDelay()]:::mth
  N11724 --> N11725
  N11726[humanDelay()]:::mth
  N11724 --> N11726
  N11727[microPause()]:::mth
  N11724 --> N11727
  N11728[thinkingPause()]:::mth
  N11724 --> N11728
  N11729[moveMouse()]:::mth
  N11724 --> N11729
  N11733[File: NativeMessaging.ts]:::file
  N11296 --> N11733
  N11734[Class: NativeMessaging]:::cls
  N11733 --> N11734
  N11735[isAvailable()]:::mth
  N11734 --> N11735
  N11736[sendMessage()]:::mth
  N11734 --> N11736
  N11737[ping()]:::mth
  N11734 --> N11737
  N11738[getStatus()]:::mth
  N11734 --> N11738
  N11739[startService()]:::mth
  N11734 --> N11739
  N11740[File: index.ts]:::file
  N11296 --> N11740
  N11741[Class: BackgroundService]:::cls
  N11740 --> N11741
  N11742[init()]:::mth
  N11741 --> N11742
  N11743[startCleanupTimer()]:::mth
  N11741 --> N11743
  N11744[tryInitialConnection()]:::mth
  N11741 --> N11744
  N11745[checkRelayHealth()]:::mth
  N11741 --> N11745
  N11746[getOrCreateAgentId()]:::mth
  N11741 --> N11746
  N11747[File: SimpleChatBridge.ts]:::file
  N11296 --> N11747
  N11748[Class: SimpleChatBridge]:::cls
  N11747 --> N11748
  N11749[upgrade()]:::mth
  N11748 --> N11749
  N11750[isExtensionUiElement()]:::mth
  N11748 --> N11750
  N11751[isSupportedPlatform()]:::mth
  N11748 --> N11751
  N11752[init()]:::mth
  N11748 --> N11752
  N11753[loadCustomSites()]:::mth
  N11748 --> N11753
  N11754[File: SiteConfigs.ts]:::file
  N11296 --> N11754
  N11755[Class: while]:::cls
  N11754 --> N11755
  N11756[getSiteConfig()]:::mth
  N11755 --> N11756
  N11757[File: UniversalChatDetector.ts]:::file
  N11296 --> N11757
  N11758[Class: UniversalChatDetector]:::cls
  N11757 --> N11758
  N11759[startDetection()]:::mth
  N11758 --> N11759
  N11760[stopDetection()]:::mth
  N11758 --> N11760
  N11761[getElements()]:::mth
  N11758 --> N11761
  N11762[detectElements()]:::mth
  N11758 --> N11762
  N11763[findInputElement()]:::mth
  N11758 --> N11763
  N11765[File: index.ts]:::file
  N11296 --> N11765
  N11766[Class: FuseConnectContentScript]:::cls
  N11765 --> N11766
  N11767[init()]:::mth
  N11766 --> N11767
  N11768[setup()]:::mth
  N11766 --> N11768
  N11769[startChatDetection()]:::mth
  N11766 --> N11769
  N11770[setupDebugUtils()]:::mth
  N11766 --> N11770
  N11771[showPanel()]:::mth
  N11766 --> N11771
  N11772[File: FloatingPanel.ts]:::file
  N11296 --> N11772
  N11773[Class: EnhancedFloatingPanel]:::cls
  N11772 --> N11773
  N11774[startCleanupInterval()]:::mth
  N11773 --> N11774
  N11775[requestConnectionState()]:::mth
  N11773 --> N11775
  N11776[loadState()]:::mth
  N11773 --> N11776
  N11777[saveState()]:::mth
  N11773 --> N11777
  N11778[inject()]:::mth
  N11773 --> N11778
  N11779[File: self-prompting.ts]:::file
  N11296 --> N11779
  N11780[Class: SelfPrompter]:::cls
  N11779 --> N11780
  N11781[updateActivity()]:::mth
  N11780 --> N11781
  N11782[enable()]:::mth
  N11780 --> N11782
  N11783[disable()]:::mth
  N11780 --> N11783
  N11784[checkAndPrompt()]:::mth
  N11780 --> N11784
  N11785[selectPrompt()]:::mth
  N11780 --> N11785
  N11786[File: AccessibilityTree.ts]:::file
  N11296 --> N11786
  N11787[Class: AccessibilityTreeGenerator]:::cls
  N11786 --> N11787
  N11788[generateTree()]:::mth
  N11787 --> N11788
  N11789[processElement()]:::mth
  N11787 --> N11789
  N11790[shouldIncludeElement()]:::mth
  N11787 --> N11790
  N11791[getRole()]:::mth
  N11787 --> N11791
  N11792[getLabel()]:::mth
  N11787 --> N11792
  N11793[File: AgentVisualIndicator.ts]:::file
  N11296 --> N11793
  N11794[Class: AgentVisualIndicator]:::cls
  N11793 --> N11794
  N11795[showAgentActive()]:::mth
  N11794 --> N11795
  N11796[hideAgentActive()]:::mth
  N11794 --> N11796
  N11797[showStaticIndicator()]:::mth
  N11794 --> N11797
  N11798[hideStaticIndicator()]:::mth
  N11794 --> N11798
  N11799[hideForToolUse()]:::mth
  N11794 --> N11799
  N11800[File: CaptchaHandler.ts]:::file
  N11296 --> N11800
  N11801[Class: CaptchaHandler]:::cls
  N11800 --> N11801
  N11802[detectCaptcha()]:::mth
  N11801 --> N11802
  N11803[attemptBypass()]:::mth
  N11801 --> N11803
  N11804[waitForCaptchaSolved()]:::mth
  N11801 --> N11804
  N11805[detectRecaptchaV2()]:::mth
  N11801 --> N11805
  N11806[detectRecaptchaV3()]:::mth
  N11801 --> N11806
  N11807[File: HumanBehaviorSimulator.ts]:::file
  N11296 --> N11807
  N11808[Class: HumanBehaviorSimulator]:::cls
  N11807 --> N11808
  N11809[randomDelay()]:::mth
  N11808 --> N11809
  N11810[humanDelay()]:::mth
  N11808 --> N11810
  N11811[microPause()]:::mth
  N11808 --> N11811
  N11812[thinkingPause()]:::mth
  N11808 --> N11812
  N11813[moveMouse()]:::mth
  N11808 --> N11813
  N11814[File: TnfTranscriptClient.ts]:::file
  N11296 --> N11814
  N11815[Class: TnfTranscriptClient]:::cls
  N11814 --> N11815
  N11816[latest()]:::mth
  N11815 --> N11816
  N11817[since()]:::mth
  N11815 --> N11817
  N11818[append()]:::mth
  N11815 --> N11818
  N11819[File: analytics-service.ts]:::file
  N11296 --> N11819
  N11820[Class: AnalyticsService]:::cls
  N11819 --> N11820
  N11821[track()]:::mth
  N11820 --> N11821
  N11822[getSessionId()]:::mth
  N11820 --> N11822
  N11823[getEvents()]:::mth
  N11820 --> N11823
  N11824[getEventsByName()]:::mth
  N11820 --> N11824
  N11825[getUsageStats()]:::mth
  N11820 --> N11825
  N11826[File: authentication-service.ts]:::file
  N11296 --> N11826
  N11827[Class: AuthenticationService]:::cls
  N11826 --> N11827
  N11828[initialize()]:::mth
  N11827 --> N11828
  N11829[authenticateYouTube()]:::mth
  N11827 --> N11829
  N11830[setGeminiAPIKey()]:::mth
  N11827 --> N11830
  N11831[validateGeminiAPIKey()]:::mth
  N11827 --> N11831
  N11832[setYouTubeApiKey()]:::mth
  N11827 --> N11832
  N11833[File: developer-mode-service.ts]:::file
  N11296 --> N11833
  N11834[Class: DeveloperModeService]:::cls
  N11833 --> N11834
  N11835[checkDeveloperMode()]:::mth
  N11834 --> N11835
  N11836[getVideoInfoViaGoogleSearch()]:::mth
  N11834 --> N11836
  N11837[waitForAIOverview()]:::mth
  N11834 --> N11837
  N11838[extractAIOverview()]:::mth
  N11834 --> N11838
  N11839[processWithAIStudio()]:::mth
  N11834 --> N11839
  N11840[File: knowledge-base-service.ts]:::file
  N11296 --> N11840
  N11841[Class: KnowledgeBaseService]:::cls
  N11840 --> N11841
  N11842[addReport()]:::mth
  N11841 --> N11842
  N11843[extractConcepts()]:::mth
  N11841 --> N11843
  N11844[isAIRelated()]:::mth
  N11841 --> N11844
  N11845[categorize()]:::mth
  N11841 --> N11845
  N11846[extractKeywords()]:::mth
  N11841 --> N11846
  N11847[File: notebooklm-service.ts]:::file
  N11296 --> N11847
  N11848[Class: NotebookLMService]:::cls
  N11847 --> N11848
  N11849[createNotebook()]:::mth
  N11848 --> N11849
  N11850[bulkImport()]:::mth
  N11848 --> N11850
  N11851[importReport()]:::mth
  N11848 --> N11851
  N11852[generateAudioOverview()]:::mth
  N11848 --> N11852
  N11853[waitForAudioGeneration()]:::mth
  N11848 --> N11853
  N11854[File: smart-processing-service.ts]:::file
  N11296 --> N11854
  N11855[Class: SmartProcessingService]:::cls
  N11854 --> N11855
  N11856[determineProcessingLevel()]:::mth
  N11855 --> N11856
  N11857[processVideo()]:::mth
  N11855 --> N11857
  N11858[getMetadata()]:::mth
  N11855 --> N11858
  N11859[getTranscript()]:::mth
  N11855 --> N11859
  N11860[parseTranscript()]:::mth
  N11855 --> N11860
  N11861[File: storage-service.ts]:::file
  N11296 --> N11861
  N11862[Class: StorageService]:::cls
  N11861 --> N11862
  N11863[get()]:::mth
  N11862 --> N11863
  N11864[set()]:::mth
  N11862 --> N11864
  N11865[remove()]:::mth
  N11862 --> N11865
  N11866[clear()]:::mth
  N11862 --> N11866
  N11867[getAll()]:::mth
  N11862 --> N11867
  N11868[File: subscription-service.ts]:::file
  N11296 --> N11868
  N11869[Class: SubscriptionService]:::cls
  N11868 --> N11869
  N11870[checkStatus()]:::mth
  N11869 --> N11870
  N11871[getFeatures()]:::mth
  N11869 --> N11871
  N11872[getFreeFeatures()]:::mth
  N11869 --> N11872
  N11873[getProFeatures()]:::mth
  N11869 --> N11873
  N11874[getEnterpriseFeatures()]:::mth
  N11869 --> N11874
  N11875[File: youtube-service.ts]:::file
  N11296 --> N11875
  N11876[Class: YouTubeService]:::cls
  N11875 --> N11876
  N11877[authenticate()]:::mth
  N11876 --> N11877
  N11878[isAuthenticated()]:::mth
  N11876 --> N11878
  N11879[ensureAuthenticated()]:::mth
  N11876 --> N11879
  N11880[makeRequest()]:::mth
  N11876 --> N11880
  N11881[getPlaylists()]:::mth
  N11876 --> N11881
  N11885[File: NativeMessaging.ts]:::file
  N11296 --> N11885
  N11886[Class: NativeMessaging]:::cls
  N11885 --> N11886
  N11887[isAvailable()]:::mth
  N11886 --> N11887
  N11888[sendMessage()]:::mth
  N11886 --> N11888
  N11889[ping()]:::mth
  N11886 --> N11889
  N11890[getStatus()]:::mth
  N11886 --> N11890
  N11891[startService()]:::mth
  N11886 --> N11891
  N11892[cloud-sandbox]:::pkg
  TNF --> N11892
  N11893[File: AuditLogger.ts]:::file
  N11892 --> N11893
  N11894[Class: AuditLogger]:::cls
  N11893 --> N11894
  N11895[save()]:::mth
  N11894 --> N11895
  N11896[logAuthentication()]:::mth
  N11894 --> N11896
  N11897[logAuthorization()]:::mth
  N11894 --> N11897
  N11898[logToolExecution()]:::mth
  N11894 --> N11898
  N11899[logAccessDenied()]:::mth
  N11894 --> N11899
  N11900[File: CloudSandboxAuthGuard.ts]:::file
  N11892 --> N11900
  N11901[Class: CloudSandboxAuthGuard]:::cls
  N11900 --> N11901
  N11902[authenticateConnection()]:::mth
  N11901 --> N11902
  N11903[validateJwtToken()]:::mth
  N11901 --> N11903
  N11904[validateAgentApiKey()]:::mth
  N11901 --> N11904
  N11905[extractBearerToken()]:::mth
  N11901 --> N11905
  N11906[extractApiKey()]:::mth
  N11901 --> N11906
  N11907[File: SecureCloudSandboxModule.ts]:::file
  N11892 --> N11907
  N11908[Class: SecureCloudSandboxModule]:::cls
  N11907 --> N11908
  N11909[authenticateConnection()]:::mth
  N11908 --> N11909
  N11910[getAvailableTools()]:::mth
  N11908 --> N11910
  N11911[canUserAccessTool()]:::mth
  N11908 --> N11911
  N11912[checkTenantQuota()]:::mth
  N11908 --> N11912
  N11913[getTenantUsage()]:::mth
  N11908 --> N11913
  N11914[File: TenantIsolationService.ts]:::file
  N11892 --> N11914
  N11915[Class: TenantIsolationService]:::cls
  N11914 --> N11915
  N11916[checkQuota()]:::mth
  N11915 --> N11916
  N11917[recordExecutionStart()]:::mth
  N11915 --> N11917
  N11918[recordExecutionEnd()]:::mth
  N11915 --> N11918
  N11919[recordBrowserSessionStart()]:::mth
  N11915 --> N11919
  N11920[recordBrowserSessionEnd()]:::mth
  N11915 --> N11920
  N11921[File: ToolPermissionChecker.ts]:::file
  N11892 --> N11921
  N11922[Class: ToolPermissionChecker]:::cls
  N11921 --> N11922
  N11923[checkPermission()]:::mth
  N11922 --> N11923
  N11924[performSecurityCheck()]:::mth
  N11922 --> N11924
  N11925[initializeToolPermissions()]:::mth
  N11922 --> N11925
  N11926[getToolPermissions()]:::mth
  N11922 --> N11926
  N11927[getAvailableTools()]:::mth
  N11922 --> N11927
  N11931[File: devtools-bridge.ts]:::file
  N11892 --> N11931
  N11932[Class: DevToolsBridge]:::cls
  N11931 --> N11932
  N11933[setupWebSocketServer()]:::mth
  N11932 --> N11933
  N11934[registerBrowser()]:::mth
  N11932 --> N11934
  N11935[unregisterBrowser()]:::mth
  N11932 --> N11935
  N11936[takeScreenshot()]:::mth
  N11932 --> N11936
  N11937[evaluateScript()]:::mth
  N11932 --> N11937
  N11941[File: SkillChains.ts]:::file
  N11892 --> N11941
  N11942[Class: SkillChain]:::cls
  N11941 --> N11942
  N11943[execute()]:::mth
  N11942 --> N11943
  N11944[getSchema()]:::mth
  N11942 --> N11944
  N11945[getPrompt()]:::mth
  N11942 --> N11945
  N11946[register()]:::mth
  N11942 --> N11946
  N11947[get()]:::mth
  N11942 --> N11947
  N11948[Class: SkillRegistry]:::cls
  N11941 --> N11948
  N11949[execute()]:::mth
  N11948 --> N11949
  N11950[getSchema()]:::mth
  N11948 --> N11950
  N11951[getPrompt()]:::mth
  N11948 --> N11951
  N11952[register()]:::mth
  N11948 --> N11952
  N11953[get()]:::mth
  N11948 --> N11953
  N11954[File: ToolWrapper.ts]:::file
  N11892 --> N11954
  N11955[Class: ToolWrapper]:::cls
  N11954 --> N11955
  N11956[execute()]:::mth
  N11955 --> N11956
  N11957[getSchema()]:::mth
  N11955 --> N11957
  N11958[getMCPSchema()]:::mth
  N11955 --> N11958
  N11959[validateParameters()]:::mth
  N11955 --> N11959
  N11960[sanitizeParameters()]:::mth
  N11955 --> N11960
  N11961[Class: ToolRegistry]:::cls
  N11954 --> N11961
  N11962[execute()]:::mth
  N11961 --> N11962
  N11963[getSchema()]:::mth
  N11961 --> N11963
  N11964[getMCPSchema()]:::mth
  N11961 --> N11964
  N11965[validateParameters()]:::mth
  N11961 --> N11965
  N11966[sanitizeParameters()]:::mth
  N11961 --> N11966
  N11968[demo-agent-extension]:::pkg
  TNF --> N11968
  N11970[external]:::pkg
  TNF --> N11970
  N11977[File: healthService.ts]:::file
  N11970 --> N11977
  N11978[Class: HealthService]:::cls
  N11977 --> N11978
  N11979[getInstance()]:::mth
  N11978 --> N11979
  N11980[performHealthCheck()]:::mth
  N11978 --> N11980
  N11981[sanitizeHealthResponse()]:::mth
  N11978 --> N11981
  N11982[sanitizeErrorMessage()]:::mth
  N11978 --> N11982
  N11983[getSystemHealth()]:::mth
  N11978 --> N11983
  N11985[File: tokenEstimationService.ts]:::file
  N11970 --> N11985
  N11986[Class: TokenEstimationService]:::cls
  N11985 --> N11986
  N11987[estimateToolTokens()]:::mth
  N11986 --> N11987
  N11988[estimateResourceTokens()]:::mth
  N11986 --> N11988
  N11989[estimatePromptTokens()]:::mth
  N11986 --> N11989
  N11990[estimateServerTokens()]:::mth
  N11986 --> N11990
  N11991[estimateArgumentsTokens()]:::mth
  N11986 --> N11991
  N11993[File: sdkOAuthClientProvider.ts]:::file
  N11970 --> N11993
  N11994[Class: SDKOAuthClientProvider]:::cls
  N11993 --> N11994
  N11995[redirectUrl()]:::mth
  N11994 --> N11995
  N11996[clientMetadata()]:::mth
  N11994 --> N11996
  N11997[clientInformation()]:::mth
  N11994 --> N11997
  N11998[saveClientInformation()]:::mth
  N11994 --> N11998
  N11999[tokens()]:::mth
  N11994 --> N11999
  N12001[File: sdkOAuthServerProvider.ts]:::file
  N11970 --> N12001
  N12002[Class: FileBasedClientsStore]:::cls
  N12001 --> N12002
  N12003[getClientKey()]:::mth
  N12002 --> N12003
  N12004[getClient()]:::mth
  N12002 --> N12004
  N12005[registerClient()]:::mth
  N12002 --> N12005
  N12006[clientsStore()]:::mth
  N12002 --> N12006
  N12007[authorize()]:::mth
  N12002 --> N12007
  N12008[Class: SDKOAuthServerProvider]:::cls
  N12001 --> N12008
  N12009[getClientKey()]:::mth
  N12008 --> N12009
  N12010[getClient()]:::mth
  N12008 --> N12010
  N12011[registerClient()]:::mth
  N12008 --> N12011
  N12012[clientsStore()]:::mth
  N12008 --> N12012
  N12013[authorize()]:::mth
  N12008 --> N12013
  N12016[File: authCodeRepository.ts]:::file
  N11970 --> N12016
  N12017[Class: AuthCodeRepository]:::cls
  N12016 --> N12017
  N12018[create()]:::mth
  N12017 --> N12018
  N12019[get()]:::mth
  N12017 --> N12019
  N12020[delete()]:::mth
  N12017 --> N12020
  N12022[File: authRequestRepository.ts]:::file
  N11970 --> N12022
  N12023[Class: AuthRequestRepository]:::cls
  N12022 --> N12023
  N12024[create()]:::mth
  N12023 --> N12024
  N12025[get()]:::mth
  N12023 --> N12025
  N12026[delete()]:::mth
  N12023 --> N12026
  N12028[File: clientDataRepository.ts]:::file
  N11970 --> N12028
  N12029[Class: ClientDataRepository]:::cls
  N12028 --> N12029
  N12030[save()]:::mth
  N12029 --> N12030
  N12031[get()]:::mth
  N12029 --> N12031
  N12032[delete()]:::mth
  N12029 --> N12032
  N12034[File: clientSessionRepository.ts]:::file
  N11970 --> N12034
  N12035[Class: ClientSessionRepository]:::cls
  N12034 --> N12035
  N12036[save()]:::mth
  N12035 --> N12036
  N12037[get()]:::mth
  N12035 --> N12037
  N12038[delete()]:::mth
  N12035 --> N12038
  N12039[list()]:::mth
  N12035 --> N12039
  N12040[getSessionId()]:::mth
  N12035 --> N12040
  N12042[File: fileStorageService.ts]:::file
  N11970 --> N12042
  N12043[Class: FileStorageService]:::cls
  N12042 --> N12043
  N12044[ensureDirectory()]:::mth
  N12043 --> N12044
  N12045[extractUuidPart()]:::mth
  N12043 --> N12045
  N12046[migrateOldFilesIfNeeded()]:::mth
  N12043 --> N12046
  N12047[createMigrationFlag()]:::mth
  N12043 --> N12047
  N12048[getCurrentSubDir()]:::mth
  N12043 --> N12048
  N12050[File: oauthStorageService.ts]:::file
  N11970 --> N12050
  N12051[Class: OAuthStorageService]:::cls
  N12050 --> N12051
  N12052[processConsentApproval()]:::mth
  N12051 --> N12052
  N12053[processConsentDenial()]:::mth
  N12051 --> N12053
  N12054[createAuthorizationRequest()]:::mth
  N12051 --> N12054
  N12055[getAuthorizationRequest()]:::mth
  N12051 --> N12055
  N12056[sessionRepository()]:::mth
  N12051 --> N12056
  N12058[File: sessionRepository.ts]:::file
  N11970 --> N12058
  N12059[Class: SessionRepository]:::cls
  N12058 --> N12059
  N12060[create()]:::mth
  N12059 --> N12060
  N12061[createWithId()]:::mth
  N12059 --> N12061
  N12062[get()]:::mth
  N12059 --> N12062
  N12063[delete()]:::mth
  N12059 --> N12063
  N12084[File: connectionHelper.ts]:::file
  N11970 --> N12084
  N12085[Class: McpConnectionHelper]:::cls
  N12084 --> N12085
  N12086[connectToServers()]:::mth
  N12085 --> N12086
  N12087[getServerCapabilities()]:::mth
  N12085 --> N12087
  N12088[cleanup()]:::mth
  N12085 --> N12088
  N12092[File: installWizard.ts]:::file
  N11970 --> N12092
  N12093[Class: InstallWizard]:::cls
  N12092 --> N12093
  N12094[run()]:::mth
  N12093 --> N12094
  N12095[cleanup()]:::mth
  N12093 --> N12095
  N12096[cancelledResult()]:::mth
  N12093 --> N12096
  N12134[File: connectionHelper.ts]:::file
  N11970 --> N12134
  N12135[Class: McpConnectionHelper]:::cls
  N12134 --> N12135
  N12136[connectToServers()]:::mth
  N12135 --> N12136
  N12137[getServerCapabilities()]:::mth
  N12135 --> N12137
  N12138[cleanup()]:::mth
  N12135 --> N12138
  N12141[File: configChangeDetector.ts]:::file
  N11970 --> N12141
  N12142[Class: ConfigChangeDetector]:::cls
  N12141 --> N12142
  N12143[deepEqual()]:::mth
  N12142 --> N12143
  N12144[getChangedFields()]:::mth
  N12142 --> N12144
  N12145[detectChanges()]:::mth
  N12142 --> N12145
  N12147[File: configContext.ts]:::file
  N11970 --> N12147
  N12148[Class: ConfigContext]:::cls
  N12147 --> N12148
  N12149[getInstance()]:::mth
  N12148 --> N12149
  N12150[setConfigDir()]:::mth
  N12148 --> N12150
  N12151[setConfigPath()]:::mth
  N12148 --> N12151
  N12152[reset()]:::mth
  N12148 --> N12152
  N12153[getResolvedConfigPath()]:::mth
  N12148 --> N12153
  N12155[File: configLoader.ts]:::file
  N11970 --> N12155
  N12156[Class: ConfigLoader]:::cls
  N12155 --> N12156
  N12157[ensureConfigExists()]:::mth
  N12156 --> N12157
  N12158[getConfigFilePath()]:::mth
  N12156 --> N12158
  N12159[checkFileModified()]:::mth
  N12156 --> N12159
  N12160[loadRawConfig()]:::mth
  N12156 --> N12160
  N12161[validateServerConfig()]:::mth
  N12156 --> N12161
  N12164[File: configManager.ts]:::file
  N11970 --> N12164
  N12165[Class: ConfigManager]:::cls
  N12164 --> N12165
  N12166[getInstance()]:::mth
  N12165 --> N12166
  N12167[setupWatcherEvents()]:::mth
  N12165 --> N12167
  N12168[initialize()]:::mth
  N12165 --> N12168
  N12169[stop()]:::mth
  N12165 --> N12169
  N12170[loadConfig()]:::mth
  N12165 --> N12170
  N12172[File: configWatcher.ts]:::file
  N11970 --> N12172
  N12173[Class: ConfigWatcher]:::cls
  N12172 --> N12173
  N12174[startWatching()]:::mth
  N12173 --> N12174
  N12175[stopWatching()]:::mth
  N12173 --> N12175
  N12176[debouncedReloadConfig()]:::mth
  N12173 --> N12176
  N12180[File: mcpConfigManager.ts]:::file
  N11970 --> N12180
  N12181[Class: McpConfigManager]:::cls
  N12180 --> N12181
  N12182[getInstance()]:::mth
  N12181 --> N12182
  N12183[ensureConfigExists()]:::mth
  N12181 --> N12183
  N12184[loadConfig()]:::mth
  N12181 --> N12184
  N12185[substituteEnvVarsInConfig()]:::mth
  N12181 --> N12185
  N12186[checkFileModified()]:::mth
  N12181 --> N12186
  N12190[File: templateProcessor.ts]:::file
  N11970 --> N12190
  N12191[Class: TemplateProcessor]:::cls
  N12190 --> N12191
  N12192[loadConfigWithTemplates()]:::mth
  N12191 --> N12192
  N12193[processTemplates()]:::mth
  N12191 --> N12193
  N12194[hashContext()]:::mth
  N12191 --> N12194
  N12195[getTemplateProcessingErrors()]:::mth
  N12191 --> N12195
  N12196[hasTemplateProcessingErrors()]:::mth
  N12191 --> N12196
  N12207[File: asyncLoadingOrchestrator.ts]:::file
  N11970 --> N12207
  N12208[Class: handles]:::cls
  N12207 --> N12208
  N12209[initialize()]:::mth
  N12208 --> N12209
  N12210[initializeNotifications()]:::mth
  N12208 --> N12210
  N12211[setupEventChain()]:::mth
  N12208 --> N12211
  N12212[setupNotificationEvents()]:::mth
  N12208 --> N12212
  N12213[handleServerReady()]:::mth
  N12208 --> N12213
  N12214[Class: AsyncLoadingOrchestrator]:::cls
  N12207 --> N12214
  N12215[initialize()]:::mth
  N12214 --> N12215
  N12216[initializeNotifications()]:::mth
  N12214 --> N12216
  N12217[setupEventChain()]:::mth
  N12214 --> N12217
  N12218[setupNotificationEvents()]:::mth
  N12214 --> N12218
  N12219[handleServerReady()]:::mth
  N12214 --> N12219
  N12221[File: capabilityAggregator.ts]:::file
  N11970 --> N12221
  N12222[Class: CapabilityAggregator]:::cls
  N12221 --> N12222
  N12223[createEmptyCapabilities()]:::mth
  N12222 --> N12223
  N12224[getCurrentCapabilities()]:::mth
  N12222 --> N12224
  N12225[updateCapabilities()]:::mth
  N12222 --> N12225
  N12226[refreshCapabilities()]:::mth
  N12222 --> N12226
  N12227[aggregateFromReadyServers()]:::mth
  N12222 --> N12227
  N12236[File: internalCapabilitiesProvider.ts]:::file
  N11970 --> N12236
  N12237[Class: InternalCapabilitiesProvider]:::cls
  N12236 --> N12237
  N12238[getInstance()]:::mth
  N12237 --> N12238
  N12239[initialize()]:::mth
  N12237 --> N12239
  N12240[setLazyLoadingOrchestrator()]:::mth
  N12237 --> N12240
  N12241[getAvailableTools()]:::mth
  N12237 --> N12241
  N12242[executeTool()]:::mth
  N12237 --> N12242
  N12245[File: lazyLoadingOrchestrator.ts]:::file
  N11970 --> N12245
  N12246[Class: LazyLoadingOrchestrator]:::cls
  N12245 --> N12246
  N12247[initialize()]:::mth
  N12246 --> N12247
  N12248[buildToolRegistry()]:::mth
  N12246 --> N12248
  N12249[preloadTools()]:::mth
  N12246 --> N12249
  N12250[loadSchemaFromServer()]:::mth
  N12246 --> N12250
  N12251[preloadToolsList()]:::mth
  N12246 --> N12251
  N12255[File: metaToolProvider.ts]:::file
  N11970 --> N12255
  N12256[Class: MetaToolProvider]:::cls
  N12255 --> N12256
  N12257[resolveConnectionKey()]:::mth
  N12256 --> N12257
  N12258[setAllowedServers()]:::mth
  N12256 --> N12258
  N12259[toolRegistry()]:::mth
  N12256 --> N12259
  N12260[getMetaTools()]:::mth
  N12256 --> N12260
  N12261[callMetaTool()]:::mth
  N12256 --> N12261
  N12263[File: schemaCache.ts]:::file
  N11970 --> N12263
  N12264[Class: SchemaCache]:::cls
  N12263 --> N12264
  N12265[hitRate()]:::mth
  N12264 --> N12265
  N12266[hitRate()]:::mth
  N12264 --> N12266
  N12267[getCacheKey()]:::mth
  N12264 --> N12267
  N12268[isExpired()]:::mth
  N12264 --> N12268
  N12269[evictOldest()]:::mth
  N12264 --> N12269
  N12272[File: toolRegistry.ts]:::file
  N11970 --> N12272
  N12273[Class: ToolRegistry]:::cls
  N12272 --> N12273
  N12274[fromToolsMap()]:::mth
  N12273 --> N12274
  N12275[fromToolsWithServer()]:::mth
  N12273 --> N12275
  N12276[empty()]:::mth
  N12273 --> N12276
  N12277[listTools()]:::mth
  N12273 --> N12277
  N12278[getServers()]:::mth
  N12273 --> N12278
  N12280[File: clientFactory.ts]:::file
  N11970 --> N12280
  N12281[Class: ClientFactory]:::cls
  N12280 --> N12281
  N12282[createClient()]:::mth
  N12281 --> N12282
  N12283[createClientInstance()]:::mth
  N12281 --> N12283
  N12284[createPooledClientInstance()]:::mth
  N12281 --> N12284
  N12286[File: clientManager.ts]:::file
  N11970 --> N12286
  N12287[Class: ClientManager]:::cls
  N12286 --> N12287
  N12288[getOrCreateInstance()]:::mth
  N12287 --> N12288
  N12289[current()]:::mth
  N12287 --> N12289
  N12290[resetInstance()]:::mth
  N12287 --> N12290
  N12291[setInstructionAggregator()]:::mth
  N12287 --> N12291
  N12292[extractAndCacheInstructions()]:::mth
  N12287 --> N12292
  N12293[File: connectionHandler.test.ts]:::file
  N11970 --> N12293
  N12294[Class: extends]:::cls
  N12293 --> N12294
  N12295[File: connectionHandler.ts]:::file
  N11970 --> N12295
  N12296[Class: ConnectionHandler]:::cls
  N12295 --> N12296
  N12297[createCancellableDelay()]:::mth
  N12296 --> N12297
  N12299[File: oauthFlowHandler.ts]:::file
  N11970 --> N12299
  N12300[Class: OAuthFlowHandler]:::cls
  N12299 --> N12300
  N12301[extractAuthorizationUrl()]:::mth
  N12300 --> N12301
  N12302[createClientForOAuth()]:::mth
  N12300 --> N12302
  N12303[handleOAuthRequired()]:::mth
  N12300 --> N12303
  N12304[completeOAuthAndReconnect()]:::mth
  N12300 --> N12304
  N12306[File: transportRecreator.ts]:::file
  N11970 --> N12306
  N12307[Class: TransportRecreator]:::cls
  N12306 --> N12307
  N12308[recreateHttpTransport()]:::mth
  N12307 --> N12308
  N12309[File: types.ts]:::file
  N11970 --> N12309
  N12310[Class: OAuthRequiredError]:::cls
  N12309 --> N12310
  N12312[File: configChangeHandler.ts]:::file
  N11970 --> N12312
  N12313[Class: ConfigChangeHandler]:::cls
  N12312 --> N12313
  N12314[getServerManager()]:::mth
  N12313 --> N12314
  N12315[getInstance()]:::mth
  N12313 --> N12315
  N12316[initialize()]:::mth
  N12313 --> N12316
  N12317[handleConfigChanges()]:::mth
  N12313 --> N12317
  N12318[processChange()]:::mth
  N12313 --> N12318
  N12320[File: globalContextManager.ts]:::file
  N11970 --> N12320
  N12321[Class: GlobalContextManager]:::cls
  N12320 --> N12321
  N12322[getInstance()]:::mth
  N12321 --> N12322
  N12323[initialize()]:::mth
  N12321 --> N12323
  N12324[getContext()]:::mth
  N12321 --> N12324
  N12325[hasContext()]:::mth
  N12321 --> N12325
  N12326[updateContext()]:::mth
  N12321 --> N12326
  N12330[File: clientTemplateTracker.ts]:::file
  N11970 --> N12330
  N12331[Class: ClientTemplateTracker]:::cls
  N12330 --> N12331
  N12332[addClientTemplate()]:::mth
  N12331 --> N12332
  N12333[removeClient()]:::mth
  N12331 --> N12333
  N12334[removeClientFromInstance()]:::mth
  N12331 --> N12334
  N12335[hasClients()]:::mth
  N12331 --> N12335
  N12336[getClientCount()]:::mth
  N12331 --> N12336
  N12338[File: filterCache.ts]:::file
  N11970 --> N12338
  N12339[Class: FilterCache]:::cls
  N12338 --> N12339
  N12340[getOrParseExpression()]:::mth
  N12339 --> N12340
  N12341[getCachedResults()]:::mth
  N12339 --> N12341
  N12342[setCachedResults()]:::mth
  N12339 --> N12342
  N12343[generateCacheKey()]:::mth
  N12339 --> N12343
  N12344[ensureCapacity()]:::mth
  N12339 --> N12344
  N12346[File: filteringService.ts]:::file
  N11970 --> N12346
  N12347[Class: FilteringService]:::cls
  N12346 --> N12347
  N12348[getFilteredConnections()]:::mth
  N12347 --> N12348
  N12349[createFilter()]:::mth
  N12347 --> N12349
  N12350[byTags()]:::mth
  N12347 --> N12350
  N12351[byTagExpression()]:::mth
  N12347 --> N12351
  N12352[byTagQuery()]:::mth
  N12347 --> N12352
  N12355[File: templateFilteringService.ts]:::file
  N11970 --> N12355
  N12356[Class: TemplateFilteringService]:::cls
  N12355 --> N12356
  N12357[getMatchingTemplates()]:::mth
  N12356 --> N12357
  N12358[extractFilterOptions()]:::mth
  N12356 --> N12358
  N12359[createFilter()]:::mth
  N12356 --> N12359
  N12360[byTags()]:::mth
  N12356 --> N12360
  N12361[byPreset()]:::mth
  N12356 --> N12361
  N12363[File: templateIndex.ts]:::file
  N11970 --> N12363
  N12364[Class: TemplateIndex]:::cls
  N12363 --> N12364
  N12365[buildIndex()]:::mth
  N12364 --> N12365
  N12366[getTemplatesByTag()]:::mth
  N12364 --> N12366
  N12367[getTemplatesByTags()]:::mth
  N12364 --> N12367
  N12368[getTemplatesByAllTags()]:::mth
  N12364 --> N12368
  N12369[evaluateExpression()]:::mth
  N12364 --> N12369
  N12371[File: flagManager.ts]:::file
  N11970 --> N12371
  N12372[Class: manages]:::cls
  N12371 --> N12372
  N12373[getInstance()]:::mth
  N12372 --> N12373
  N12374[isToolEnabled()]:::mth
  N12372 --> N12374
  N12375[isCategoryEnabled()]:::mth
  N12372 --> N12375
  N12376[getEnabledTools()]:::mth
  N12372 --> N12376
  N12377[parseToolsList()]:::mth
  N12372 --> N12377
  N12378[Class: FlagManager]:::cls
  N12371 --> N12378
  N12379[getInstance()]:::mth
  N12378 --> N12379
  N12380[isToolEnabled()]:::mth
  N12378 --> N12380
  N12381[isCategoryEnabled()]:::mth
  N12378 --> N12381
  N12382[getEnabledTools()]:::mth
  N12378 --> N12382
  N12383[parseToolsList()]:::mth
  N12378 --> N12383
  N12385[File: instructionAggregator.ts]:::file
  N11970 --> N12385
  N12386[Class: InstructionAggregator]:::cls
  N12385 --> N12386
  N12387[setLazyLoadingOrchestrator()]:::mth
  N12386 --> N12387
  N12388[getLazyLoadingOrchestrator()]:::mth
  N12386 --> N12388
  N12389[setInstructions()]:::mth
  N12386 --> N12389
  N12390[removeServer()]:::mth
  N12386 --> N12390
  N12391[getFilteredInstructions()]:::mth
  N12386 --> N12391
  N12403[File: loadingStateTracker.ts]:::file
  N11970 --> N12403
  N12404[Class: provides]:::cls
  N12403 --> N12404
  N12405[startLoading()]:::mth
  N12404 --> N12405
  N12406[updateServerState()]:::mth
  N12404 --> N12406
  N12407[incrementRetryCount()]:::mth
  N12404 --> N12407
  N12408[getServerState()]:::mth
  N12404 --> N12408
  N12409[getAllServerStates()]:::mth
  N12404 --> N12409
  N12410[Class: LoadingStateTracker]:::cls
  N12403 --> N12410
  N12411[startLoading()]:::mth
  N12410 --> N12411
  N12412[updateServerState()]:::mth
  N12410 --> N12412
  N12413[incrementRetryCount()]:::mth
  N12410 --> N12413
  N12414[getServerState()]:::mth
  N12410 --> N12414
  N12415[getAllServerStates()]:::mth
  N12410 --> N12415
  N12416[File: mcpLoadingManager.ts]:::file
  N11970 --> N12416
  N12417[Class: McpLoadingManager]:::cls
  N12416 --> N12417
  N12418[startAsyncLoading()]:::mth
  N12417 --> N12418
  N12419[loadServersWithConcurrency()]:::mth
  N12417 --> N12419
  N12420[loadSingleServer()]:::mth
  N12417 --> N12420
  N12421[createClientWithTimeout()]:::mth
  N12417 --> N12421
  N12422[setupBackgroundRetry()]:::mth
  N12417 --> N12422
  N12424[File: parallelExecutor.ts]:::file
  N11970 --> N12424
  N12425[Class: ParallelExecutor]:::cls
  N12424 --> N12425
  N12427[File: notificationManager.ts]:::file
  N11970 --> N12427
  N12428[Class: NotificationManager]:::cls
  N12427 --> N12428
  N12429[handleCapabilityChanges()]:::mth
  N12428 --> N12429
  N12430[scheduleBatchedNotification()]:::mth
  N12428 --> N12430
  N12431[sendBatchedNotifications()]:::mth
  N12428 --> N12431
  N12432[sendImmediateNotifications()]:::mth
  N12428 --> N12432
  N12433[sendToolListChangedNotification()]:::mth
  N12428 --> N12433
  N12439[File: ExternalServerAdapter.ts]:::file
  N11970 --> N12439
  N12440[Class: ExternalServerAdapter]:::cls
  N12439 --> N12440
  N12441[resolveConnection()]:::mth
  N12440 --> N12441
  N12442[getStatus()]:::mth
  N12440 --> N12442
  N12443[mapClientStatusToServerStatus()]:::mth
  N12440 --> N12443
  N12444[getConnectionKey()]:::mth
  N12440 --> N12444
  N12446[File: ServerRegistry.ts]:::file
  N11970 --> N12446
  N12447[Class: ServerRegistry]:::cls
  N12446 --> N12447
  N12448[registerExternal()]:::mth
  N12447 --> N12448
  N12449[registerTemplate()]:::mth
  N12447 --> N12449
  N12450[register()]:::mth
  N12447 --> N12450
  N12451[get()]:::mth
  N12447 --> N12451
  N12452[has()]:::mth
  N12447 --> N12452
  N12454[File: TemplateServerAdapter.ts]:::file
  N11970 --> N12454
  N12455[Class: TemplateServerAdapter]:::cls
  N12454 --> N12455
  N12456[buildConnectionKeys()]:::mth
  N12455 --> N12456
  N12457[resolveConnection()]:::mth
  N12455 --> N12457
  N12458[getStatus()]:::mth
  N12455 --> N12458
  N12459[mapClientStatusToServerStatus()]:::mth
  N12455 --> N12459
  N12460[getConnectionKey()]:::mth
  N12455 --> N12460
  N12464[File: agentConfig.ts]:::file
  N11970 --> N12464
  N12465[Class: handles]:::cls
  N12464 --> N12465
  N12466[getInstance()]:::mth
  N12465 --> N12466
  N12467[updateConfig()]:::mth
  N12465 --> N12467
  N12468[getConfig()]:::mth
  N12465 --> N12468
  N12469[getUrl()]:::mth
  N12465 --> N12469
  N12470[getStreambleHttpUrl()]:::mth
  N12465 --> N12470
  N12471[Class: AgentConfigManager]:::cls
  N12464 --> N12471
  N12472[getInstance()]:::mth
  N12471 --> N12472
  N12473[updateConfig()]:::mth
  N12471 --> N12473
  N12474[getConfig()]:::mth
  N12471 --> N12474
  N12475[getUrl()]:::mth
  N12471 --> N12475
  N12476[getStreambleHttpUrl()]:::mth
  N12471 --> N12476
  N12478[File: clientInstancePool.ts]:::file
  N11970 --> N12478
  N12479[Class: handles]:::cls
  N12478 --> N12479
  N12480[getOrCreateClientInstance()]:::mth
  N12479 --> N12480
  N12481[addClientToInstance()]:::mth
  N12479 --> N12481
  N12482[removeClientFromInstance()]:::mth
  N12479 --> N12482
  N12483[getInstance()]:::mth
  N12479 --> N12483
  N12484[getTemplateInstances()]:::mth
  N12479 --> N12484
  N12485[Class: ClientInstancePool]:::cls
  N12478 --> N12485
  N12486[getOrCreateClientInstance()]:::mth
  N12485 --> N12486
  N12487[addClientToInstance()]:::mth
  N12485 --> N12487
  N12488[removeClientFromInstance()]:::mth
  N12485 --> N12488
  N12489[getInstance()]:::mth
  N12485 --> N12489
  N12490[getTemplateInstances()]:::mth
  N12485 --> N12490
  N12492[File: connectionManager.ts]:::file
  N11970 --> N12492
  N12493[Class: ConnectionManager]:::cls
  N12492 --> N12493
  N12494[setLazyLoadingOrchestrator()]:::mth
  N12493 --> N12494
  N12495[getLazyLoadingOrchestrator()]:::mth
  N12493 --> N12495
  N12496[connectTransport()]:::mth
  N12493 --> N12496
  N12497[disconnectTransport()]:::mth
  N12493 --> N12497
  N12498[getTransport()]:::mth
  N12493 --> N12498
  N12500[File: connectionResolver.ts]:::file
  N11970 --> N12500
  N12501[Class: ConnectionResolver]:::cls
  N12500 --> N12501
  N12502[getRenderedHashForSession()]:::mth
  N12501 --> N12502
  N12503[resolve()]:::mth
  N12501 --> N12503
  N12504[filterForSession()]:::mth
  N12501 --> N12504
  N12505[getSessionRenderedHashes()]:::mth
  N12501 --> N12505
  N12506[findByServerName()]:::mth
  N12501 --> N12506
  N12508[File: mcpServerLifecycleManager.ts]:::file
  N11970 --> N12508
  N12509[Class: MCPServerLifecycleManager]:::cls
  N12508 --> N12509
  N12510[startServer()]:::mth
  N12509 --> N12510
  N12511[stopServer()]:::mth
  N12509 --> N12511
  N12512[restartServer()]:::mth
  N12509 --> N12512
  N12513[getMcpServerStatus()]:::mth
  N12509 --> N12513
  N12514[isMcpServerRunning()]:::mth
  N12509 --> N12514
  N12518[File: serverManager.test.ts]:::file
  N11970 --> N12518
  N12519[Class: that]:::cls
  N12518 --> N12519
  N12520[getOrCreateInstance()]:::mth
  N12519 --> N12520
  N12521[current()]:::mth
  N12519 --> N12521
  N12522[resetInstance()]:::mth
  N12519 --> N12522
  N12523[connectTransport()]:::mth
  N12519 --> N12523
  N12524[disconnectTransport()]:::mth
  N12519 --> N12524
  N12525[Class: MockServerManager]:::cls
  N12518 --> N12525
  N12526[getOrCreateInstance()]:::mth
  N12525 --> N12526
  N12527[current()]:::mth
  N12525 --> N12527
  N12528[resetInstance()]:::mth
  N12525 --> N12528
  N12529[connectTransport()]:::mth
  N12525 --> N12529
  N12530[disconnectTransport()]:::mth
  N12525 --> N12530
  N12531[File: serverManager.ts]:::file
  N11970 --> N12531
  N12532[Class: acts]:::cls
  N12531 --> N12532
  N12533[getOrCreateInstance()]:::mth
  N12532 --> N12533
  N12534[current()]:::mth
  N12532 --> N12534
  N12535[resetInstance()]:::mth
  N12532 --> N12535
  N12536[setInstructionAggregator()]:::mth
  N12532 --> N12536
  N12537[setLazyLoadingOrchestrator()]:::mth
  N12532 --> N12537
  N12538[Class: ServerManager]:::cls
  N12531 --> N12538
  N12539[getOrCreateInstance()]:::mth
  N12538 --> N12539
  N12540[current()]:::mth
  N12538 --> N12540
  N12541[resetInstance()]:::mth
  N12538 --> N12541
  N12542[setInstructionAggregator()]:::mth
  N12538 --> N12542
  N12543[setLazyLoadingOrchestrator()]:::mth
  N12538 --> N12543
  N12545[File: templateConfigurationManager.ts]:::file
  N11970 --> N12545
  N12546[Class: TemplateConfigurationManager]:::cls
  N12545 --> N12546
  N12547[mergeServerConfigurations()]:::mth
  N12546 --> N12547
  N12548[context()]:::mth
  N12546 --> N12548
  N12549[configChanged()]:::mth
  N12546 --> N12549
  N12550[isTemplateProcessingDisabled()]:::mth
  N12546 --> N12550
  N12551[getErrorCount()]:::mth
  N12546 --> N12551
  N12553[File: templateServerManager.ts]:::file
  N11970 --> N12553
  N12554[Class: TemplateServerManager]:::cls
  N12553 --> N12554
  N12555[setInstructionAggregator()]:::mth
  N12554 --> N12555
  N12556[startCleanupTimer()]:::mth
  N12554 --> N12556
  N12557[createTemplateBasedServers()]:::mth
  N12554 --> N12557
  N12558[cleanupTemplateServers()]:::mth
  N12554 --> N12558
  N12559[getMatchingTemplateConfigs()]:::mth
  N12554 --> N12559
  N12569[File: discoveryAdapter.ts]:::file
  N11970 --> N12569
  N12570[Class: RegistryDiscoveryAdapter]:::cls
  N12569 --> N12570
  N12571[searchServers()]:::mth
  N12570 --> N12571
  N12572[discoverInstalledApps()]:::mth
  N12570 --> N12572
  N12573[discoverAppConfigs()]:::mth
  N12570 --> N12573
  N12574[checkAppConsolidationStatus()]:::mth
  N12570 --> N12574
  N12575[searchServers()]:::mth
  N12570 --> N12575
  N12578[File: index.ts]:::file
  N11970 --> N12578
  N12579[Class: AdapterFactory]:::cls
  N12578 --> N12579
  N12580[getDiscoveryAdapter()]:::mth
  N12579 --> N12580
  N12581[getInstallationAdapter()]:::mth
  N12579 --> N12581
  N12582[getManagementAdapter()]:::mth
  N12579 --> N12582
  N12583[getAllAdapters()]:::mth
  N12579 --> N12583
  N12584[cleanup()]:::mth
  N12579 --> N12584
  N12586[File: packageResolver.ts]:::file
  N11970 --> N12586
  N12587[Class: PackageResolver]:::cls
  N12586 --> N12587
  N12588[resolvePackageToServerName()]:::mth
  N12587 --> N12588
  N12591[File: installationAdapter.ts]:::file
  N11970 --> N12591
  N12592[Class: ServerInstallationAdapter]:::cls
  N12591 --> N12592
  N12593[installServer()]:::mth
  N12592 --> N12593
  N12594[uninstallServer()]:::mth
  N12592 --> N12594
  N12595[updateServer()]:::mth
  N12592 --> N12595
  N12596[listInstalledServers()]:::mth
  N12592 --> N12596
  N12597[validateTags()]:::mth
  N12592 --> N12597
  N12599[File: managementAdapter.ts]:::file
  N11970 --> N12599
  N12600[Class: ConfigManagementAdapter]:::cls
  N12599 --> N12600
  N12601[listServers()]:::mth
  N12600 --> N12601
  N12602[getServerStatus()]:::mth
  N12600 --> N12602
  N12603[enableServer()]:::mth
  N12600 --> N12603
  N12604[disableServer()]:::mth
  N12600 --> N12604
  N12605[reloadConfiguration()]:::mth
  N12600 --> N12605
  N12638[File: CustomJsonSchemaValidator.ts]:::file
  N11970 --> N12638
  N12639[Class: CustomJsonSchemaValidator]:::cls
  N12638 --> N12639
  N12640[createAjvInstance()]:::mth
  N12639 --> N12640
  N12641[addFormatsSupport()]:::mth
  N12639 --> N12641
  N12642[patchSchemaWithMissingDefs()]:::mth
  N12639 --> N12642
  N12643[preprocessSchema()]:::mth
  N12639 --> N12643
  N12644[findMissingDefinitions()]:::mth
  N12639 --> N12644
  N12666[File: presetManager.test.ts]:::file
  N11970 --> N12666
  N12667[Class: extends]:::cls
  N12666 --> N12667
  N12668[now()]:::mth
  N12667 --> N12668
  N12669[toISOString()]:::mth
  N12667 --> N12669
  N12670[File: presetManager.ts]:::file
  N11970 --> N12670
  N12671[Class: PresetManager]:::cls
  N12670 --> N12671
  N12672[getInstance()]:::mth
  N12671 --> N12672
  N12673[resetInstance()]:::mth
  N12671 --> N12673
  N12674[initialize()]:::mth
  N12671 --> N12674
  N12675[loadPresetsWithoutWatcher()]:::mth
  N12671 --> N12675
  N12676[loadPresets()]:::mth
  N12671 --> N12676
  N12678[File: tagQueryEvaluator.ts]:::file
  N11970 --> N12678
  N12679[Class: TagQueryEvaluator]:::cls
  N12678 --> N12679
  N12680[evaluate()]:::mth
  N12679 --> N12680
  N12681[stringToQuery()]:::mth
  N12679 --> N12681
  N12682[queryToString()]:::mth
  N12679 --> N12682
  N12683[validateQuery()]:::mth
  N12679 --> N12683
  N12684[buildTagServerMap()]:::mth
  N12679 --> N12684
  N12686[File: tagQueryParser.ts]:::file
  N11970 --> N12686
  N12687[Class: TagQueryParser]:::cls
  N12686 --> N12687
  N12688[parseSimple()]:::mth
  N12687 --> N12688
  N12689[parseAdvanced()]:::mth
  N12687 --> N12689
  N12690[evaluate()]:::mth
  N12687 --> N12690
  N12691[decodeURIComponent()]:::mth
  N12687 --> N12691
  N12692[tokenize()]:::mth
  N12687 --> N12692
  N12694[File: presetErrorHandler.ts]:::file
  N11970 --> N12694
  N12695[Class: for]:::cls
  N12694 --> N12695
  N12696[throwError()]:::mth
  N12695 --> N12696
  N12697[handleCliError()]:::mth
  N12695 --> N12697
  N12698[validationError()]:::mth
  N12695 --> N12698
  N12699[fileError()]:::mth
  N12695 --> N12699
  N12700[parseError()]:::mth
  N12695 --> N12700
  N12701[Class: PresetError]:::cls
  N12694 --> N12701
  N12702[throwError()]:::mth
  N12701 --> N12702
  N12703[handleCliError()]:::mth
  N12701 --> N12703
  N12704[validationError()]:::mth
  N12701 --> N12704
  N12705[fileError()]:::mth
  N12701 --> N12705
  N12706[parseError()]:::mth
  N12701 --> N12706
  N12707[Class: PresetErrorHandler]:::cls
  N12694 --> N12707
  N12708[throwError()]:::mth
  N12707 --> N12708
  N12709[handleCliError()]:::mth
  N12707 --> N12709
  N12710[validationError()]:::mth
  N12707 --> N12710
  N12711[fileError()]:::mth
  N12707 --> N12711
  N12712[parseError()]:::mth
  N12707 --> N12712
  N12714[File: presetNotificationService.ts]:::file
  N11970 --> N12714
  N12715[Class: PresetNotificationService]:::cls
  N12714 --> N12715
  N12716[sendNotification()]:::mth
  N12715 --> N12716
  N12717[getInstance()]:::mth
  N12715 --> N12717
  N12718[trackClient()]:::mth
  N12715 --> N12718
  N12719[untrackClient()]:::mth
  N12715 --> N12719
  N12720[updateClientPreset()]:::mth
  N12715 --> N12720
  N12722[File: presetServerChangeDetector.ts]:::file
  N11970 --> N12722
  N12723[Class: PresetServerChangeDetector]:::cls
  N12722 --> N12723
  N12724[detectChanges()]:::mth
  N12723 --> N12724
  N12725[updateServerList()]:::mth
  N12723 --> N12725
  N12726[getPreviousServerList()]:::mth
  N12723 --> N12726
  N12727[hasPreset()]:::mth
  N12723 --> N12727
  N12728[removePreset()]:::mth
  N12723 --> N12728
  N12731[File: cacheManager.ts]:::file
  N11970 --> N12731
  N12732[Class: CacheManager]:::cls
  N12731 --> N12732
  N12733[invalidate()]:::mth
  N12732 --> N12733
  N12734[clear()]:::mth
  N12732 --> N12734
  N12735[getStats()]:::mth
  N12732 --> N12735
  N12736[generateKey()]:::mth
  N12732 --> N12736
  N12737[startCleanupTimer()]:::mth
  N12732 --> N12737
  N12745[File: mcpRegistryClient.ts]:::file
  N11970 --> N12745
  N12746[Class: MCPRegistryClient]:::cls
  N12745 --> N12746
  N12747[getServers()]:::mth
  N12746 --> N12747
  N12748[getServersWithMetadata()]:::mth
  N12746 --> N12748
  N12749[getServerById()]:::mth
  N12746 --> N12749
  N12750[getServerVersions()]:::mth
  N12746 --> N12750
  N12751[searchServers()]:::mth
  N12746 --> N12751
  N12754[File: searchFiltering.ts]:::file
  N11970 --> N12754
  N12755[Class: SearchEngine]:::cls
  N12754 --> N12755
  N12756[fuzzySearch()]:::mth
  N12755 --> N12756
  N12757[filterByStatus()]:::mth
  N12755 --> N12757
  N12758[filterByRegistryType()]:::mth
  N12755 --> N12758
  N12759[filterByTransport()]:::mth
  N12755 --> N12759
  N12760[rankResults()]:::mth
  N12755 --> N12760
  N12764[File: progressTrackingService.ts]:::file
  N11970 --> N12764
  N12765[Class: ProgressTrackingService]:::cls
  N12764 --> N12765
  N12766[startOperation()]:::mth
  N12765 --> N12766
  N12767[updateProgress()]:::mth
  N12765 --> N12767
  N12768[completeOperation()]:::mth
  N12765 --> N12768
  N12769[failOperation()]:::mth
  N12765 --> N12769
  N12770[getOperationStatus()]:::mth
  N12765 --> N12770
  N12772[File: serverInstallationService.ts]:::file
  N11970 --> N12772
  N12773[Class: ServerInstallationService]:::cls
  N12772 --> N12773
  N12774[installServer()]:::mth
  N12773 --> N12774
  N12775[selectInstallationEndpoint()]:::mth
  N12773 --> N12775
  N12776[resolveServerById()]:::mth
  N12773 --> N12776
  N12777[createServerConfig()]:::mth
  N12773 --> N12777
  N12778[updateServer()]:::mth
  N12773 --> N12778
  N12797[File: handlebarsTemplateRenderer.ts]:::file
  N11970 --> N12797
  N12798[Class: HandlebarsTemplateRenderer]:::cls
  N12797 --> N12798
  N12799[renderTemplate()]:::mth
  N12798 --> N12799
  N12800[stringToBoolean()]:::mth
  N12798 --> N12800
  N12801[renderString()]:::mth
  N12798 --> N12801
  N12804[File: loggingSseTransport.ts]:::file
  N11970 --> N12804
  N12805[Class: LoggingSSEServerTransport]:::cls
  N12804 --> N12805
  N12806[send()]:::mth
  N12805 --> N12806
  N12818[File: restorableStreamableTransport.test.ts]:::file
  N11970 --> N12818
  N12819[Class: extends]:::cls
  N12818 --> N12819
  N12820[get()]:::mth
  N12819 --> N12820
  N12821[File: restorableStreamableTransport.ts]:::file
  N11970 --> N12821
  N12822[Class: RestorableStreamableHTTPServerTransport]:::cls
  N12821 --> N12822
  N12823[markAsRestored()]:::mth
  N12822 --> N12823
  N12824[isRestored()]:::mth
  N12822 --> N12824
  N12825[getRestorationInfo()]:::mth
  N12822 --> N12825
  N12835[File: server.ts]:::file
  N11970 --> N12835
  N12836[Class: manages]:::cls
  N12835 --> N12836
  N12837[setupMiddleware()]:::mth
  N12836 --> N12837
  N12838[setupRoutes()]:::mth
  N12836 --> N12838
  N12839[start()]:::mth
  N12836 --> N12839
  N12840[shutdown()]:::mth
  N12836 --> N12840
  N12841[Class: ExpressServer]:::cls
  N12835 --> N12841
  N12842[setupMiddleware()]:::mth
  N12841 --> N12842
  N12843[setupRoutes()]:::mth
  N12841 --> N12843
  N12844[start()]:::mth
  N12841 --> N12844
  N12845[shutdown()]:::mth
  N12841 --> N12845
  N12847[File: streamableSessionRepository.ts]:::file
  N11970 --> N12847
  N12848[Class: StreamableSessionRepository]:::cls
  N12847 --> N12848
  N12849[create()]:::mth
  N12848 --> N12849
  N12850[session()]:::mth
  N12848 --> N12850
  N12851[getSessionData()]:::mth
  N12848 --> N12851
  N12852[get()]:::mth
  N12848 --> N12852
  N12853[updateAccess()]:::mth
  N12848 --> N12853
  N12858[File: sessionService.ts]:::file
  N11970 --> N12858
  N12859[Class: SessionService]:::cls
  N12858 --> N12859
  N12860[isValidSessionId()]:::mth
  N12859 --> N12860
  N12861[getSession()]:::mth
  N12859 --> N12861
  N12862[storeInitializeResponse()]:::mth
  N12859 --> N12862
  N12863[setInitializedState()]:::mth
  N12859 --> N12863
  N12864[restoreSession()]:::mth
  N12859 --> N12864
  N12868[File: restartableStdioTransport.ts]:::file
  N11970 --> N12868
  N12869[Class: RestartableStdioTransport]:::cls
  N12868 --> N12869
  N12870[createTransport()]:::mth
  N12869 --> N12870
  N12871[handleTransportClose()]:::mth
  N12869 --> N12871
  N12872[handleTransportError()]:::mth
  N12869 --> N12872
  N12873[handleTransportMessage()]:::mth
  N12869 --> N12873
  N12874[attemptRestart()]:::mth
  N12869 --> N12874
  N12876[File: stdioProxyTransport.ts]:::file
  N11970 --> N12876
  N12877[Class: StdioProxyTransport]:::cls
  N12876 --> N12877
  N12878[enrichContextWithProjectConfig()]:::mth
  N12877 --> N12878
  N12879[generateMcpSessionId()]:::mth
  N12877 --> N12879
  N12880[detectProxyContext()]:::mth
  N12877 --> N12880
  N12881[start()]:::mth
  N12877 --> N12881
  N12882[setupHttpTransportMessageHandlers()]:::mth
  N12877 --> N12882
  N12889[File: clientInfoExtractor.ts]:::file
  N11970 --> N12889
  N12890[Class: ClientInfoExtractor]:::cls
  N12889 --> N12890
  N12891[extractFromInitializeRequest()]:::mth
  N12890 --> N12891
  N12892[getExtractedClientInfo()]:::mth
  N12890 --> N12892
  N12893[hasReceivedInitialize()]:::mth
  N12890 --> N12893
  N12894[reset()]:::mth
  N12890 --> N12894
  N12897[File: errorTypes.ts]:::file
  N11970 --> N12897
  N12898[Class: MCPError]:::cls
  N12897 --> N12898
  N12899[Class: ClientConnectionError]:::cls
  N12897 --> N12899
  N12900[Class: ClientNotFoundError]:::cls
  N12897 --> N12900
  N12901[Class: ClientOperationError]:::cls
  N12897 --> N12901
  N12902[Class: ValidationError]:::cls
  N12897 --> N12902
  N12903[Class: TransportError]:::cls
  N12897 --> N12903
  N12904[Class: InvalidRequestError]:::cls
  N12897 --> N12904
  N12905[Class: CapabilityError]:::cls
  N12897 --> N12905
  N12915[File: interactiveSelector.ts]:::file
  N11970 --> N12915
  N12916[Class: InteractiveSelector]:::cls
  N12915 --> N12916
  N12917[isValidTagQuery()]:::mth
  N12916 --> N12917
  N12918[selectServers()]:::mth
  N12916 --> N12918
  N12919[prompts()]:::mth
  N12916 --> N12919
  N12920[servers()]:::mth
  N12916 --> N12920
  N12921[confirmSave()]:::mth
  N12916 --> N12921
  N12925[File: printer.ts]:::file
  N11970 --> N12925
  N12926[Class: with]:::cls
  N12925 --> N12926
  N12927[success()]:::mth
  N12926 --> N12927
  N12928[error()]:::mth
  N12926 --> N12928
  N12929[warn()]:::mth
  N12926 --> N12929
  N12930[info()]:::mth
  N12926 --> N12930
  N12931[debug()]:::mth
  N12926 --> N12931
  N12932[Class: Printer]:::cls
  N12925 --> N12932
  N12933[success()]:::mth
  N12932 --> N12933
  N12934[error()]:::mth
  N12932 --> N12934
  N12935[warn()]:::mth
  N12932 --> N12935
  N12936[info()]:::mth
  N12932 --> N12936
  N12937[debug()]:::mth
  N12932 --> N12937
  N12938[Class: for]:::cls
  N12925 --> N12938
  N12939[success()]:::mth
  N12938 --> N12939
  N12940[error()]:::mth
  N12938 --> N12940
  N12941[warn()]:::mth
  N12938 --> N12941
  N12942[info()]:::mth
  N12938 --> N12942
  N12943[debug()]:::mth
  N12938 --> N12943
  N12947[File: urlGenerator.ts]:::file
  N11970 --> N12947
  N12948[Class: UrlGenerator]:::cls
  N12947 --> N12948
  N12949[generatePresetUrl()]:::mth
  N12948 --> N12949
  N12950[generateTagFilterUrl()]:::mth
  N12948 --> N12950
  N12951[generateTagsUrl()]:::mth
  N12948 --> N12951
  N12952[generateUrl()]:::mth
  N12948 --> N12952
  N12953[getBaseUrl()]:::mth
  N12948 --> N12953
  N12963[File: create-ui.ts]:::file
  N11970 --> N12963
  N12964[Class: CreateUiTool]:::cls
  N12963 --> N12964
  N12965[execute()]:::mth
  N12964 --> N12965
  N12966[File: fetch-ui.ts]:::file
  N11970 --> N12966
  N12967[Class: FetchUiTool]:::cls
  N12966 --> N12967
  N12968[execute()]:::mth
  N12967 --> N12968
  N12969[File: logo-search.ts]:::file
  N11970 --> N12969
  N12970[Class: LogoSearchTool]:::cls
  N12969 --> N12970
  N12971[fetchLogos()]:::mth
  N12970 --> N12971
  N12972[fetchSVGContent()]:::mth
  N12970 --> N12972
  N12973[convertToFormat()]:::mth
  N12970 --> N12973
  N12974[saveTestResult()]:::mth
  N12970 --> N12974
  N12975[execute()]:::mth
  N12970 --> N12975
  N12976[File: refine-ui.ts]:::file
  N11970 --> N12976
  N12977[Class: RefineUiTool]:::cls
  N12976 --> N12977
  N12978[execute()]:::mth
  N12977 --> N12978
  N12979[File: base-tool.ts]:::file
  N11970 --> N12979
  N12980[Class: BaseTool]:::cls
  N12979 --> N12980
  N12981[register()]:::mth
  N12980 --> N12981
  N12982[execute()]:::mth
  N12980 --> N12982
  N12983[File: callback-server.ts]:::file
  N11970 --> N12983
  N12984[Class: CallbackServer]:::cls
  N12983 --> N12984
  N12985[getPort()]:::mth
  N12984 --> N12985
  N12986[findAvailablePort()]:::mth
  N12984 --> N12986
  N12987[parseBody()]:::mth
  N12984 --> N12987
  N12988[shutdown()]:::mth
  N12984 --> N12988
  N12989[isPortAvailable()]:::mth
  N12984 --> N12989
  N12999[File: index.ts]:::file
  N11970 --> N12999
  N13000[Class: BilibiliSearchServer]:::cls
  N12999 --> N13000
  N13001[setupToolHandlers()]:::mth
  N13000 --> N13001
  N13002[performSearch()]:::mth
  N13000 --> N13002
  N13003[cleanTitle()]:::mth
  N13000 --> N13003
  N13004[getHotContent()]:::mth
  N13000 --> N13004
  N13005[formatDuration()]:::mth
  N13000 --> N13005
  N13006[File: index.ts]:::file
  N11970 --> N13006
  N13007[Class: MCPToolkit]:::cls
  N13006 --> N13007
  N13008[initialize()]:::mth
  N13007 --> N13008
  N13009[get_tools()]:::mth
  N13007 --> N13009
  N13010[MCPTool()]:::mth
  N13007 --> N13010
  N13011[tool()]:::mth
  N13007 --> N13011
  N13017[File: index.ts]:::file
  N11970 --> N13017
  N13018[Class: OpenLibraryServer]:::cls
  N13017 --> N13018
  N13019[setupToolHandlers()]:::mth
  N13018 --> N13019
  N13020[run()]:::mth
  N13018 --> N13020
  N13038[File: index.ts]:::file
  N11970 --> N13038
  N13039[Class: ServerState]:::cls
  N13038 --> N13039
  N13040[setJwtToken()]:::mth
  N13039 --> N13040
  N13041[getAuthHeaders()]:::mth
  N13039 --> N13041
  N13042[isAuthenticated()]:::mth
  N13039 --> N13042
  N13043[clearAuth()]:::mth
  N13039 --> N13043
  N13044[initializeAuth()]:::mth
  N13039 --> N13044
  N13081[File: DevToolsConnectionAdapter.ts]:::file
  N11970 --> N13081
  N13082[Class: makes]:::cls
  N13081 --> N13082
  N13083[observe()]:::mth
  N13082 --> N13083
  N13084[unobserve()]:::mth
  N13082 --> N13084
  N13085[Class: PuppeteerDevToolsConnection]:::cls
  N13081 --> N13085
  N13086[observe()]:::mth
  N13085 --> N13086
  N13087[unobserve()]:::mth
  N13085 --> N13087
  N13088[File: DevtoolsUtils.ts]:::file
  N11970 --> N13088
  N13089[Class: FakeIssuesManager]:::cls
  N13088 --> N13089
  N13090[extractUrlLikeFromDevToolsTitle()]:::mth
  N13089 --> N13090
  N13091[urlsEqual()]:::mth
  N13089 --> N13091
  N13092[normalizeUrl()]:::mth
  N13089 --> N13092
  N13093[issues()]:::mth
  N13089 --> N13093
  N13094[init()]:::mth
  N13089 --> N13094
  N13095[Class: UniverseManager]:::cls
  N13088 --> N13095
  N13096[extractUrlLikeFromDevToolsTitle()]:::mth
  N13095 --> N13096
  N13097[urlsEqual()]:::mth
  N13095 --> N13097
  N13098[normalizeUrl()]:::mth
  N13095 --> N13098
  N13099[issues()]:::mth
  N13095 --> N13099
  N13100[init()]:::mth
  N13095 --> N13100
  N13101[Class: SymbolizedError]:::cls
  N13088 --> N13101
  N13102[extractUrlLikeFromDevToolsTitle()]:::mth
  N13101 --> N13102
  N13103[urlsEqual()]:::mth
  N13101 --> N13103
  N13104[normalizeUrl()]:::mth
  N13101 --> N13104
  N13105[issues()]:::mth
  N13101 --> N13105
  N13106[init()]:::mth
  N13101 --> N13106
  N13107[File: McpContext.ts]:::file
  N11970 --> N13107
  N13108[Class: McpContext]:::cls
  N13107 --> N13108
  N13109[getNetworkMultiplierFromString()]:::mth
  N13108 --> N13109
  N13110[dispose()]:::mth
  N13108 --> N13110
  N13111[from()]:::mth
  N13108 --> N13111
  N13112[resolveCdpRequestId()]:::mth
  N13108 --> N13112
  N13113[resolveCdpElementId()]:::mth
  N13108 --> N13113
  N13114[Class: to]:::cls
  N13107 --> N13114
  N13115[getNetworkMultiplierFromString()]:::mth
  N13114 --> N13115
  N13116[dispose()]:::mth
  N13114 --> N13116
  N13117[from()]:::mth
  N13114 --> N13117
  N13118[resolveCdpRequestId()]:::mth
  N13114 --> N13118
  N13119[resolveCdpElementId()]:::mth
  N13114 --> N13119
  N13120[Class: instances]:::cls
  N13107 --> N13120
  N13121[getNetworkMultiplierFromString()]:::mth
  N13120 --> N13121
  N13122[dispose()]:::mth
  N13120 --> N13122
  N13123[from()]:::mth
  N13120 --> N13123
  N13124[resolveCdpRequestId()]:::mth
  N13120 --> N13124
  N13125[resolveCdpElementId()]:::mth
  N13120 --> N13125
  N13126[File: McpPage.ts]:::file
  N11970 --> N13126
  N13127[Class: consumed]:::cls
  N13126 --> N13127
  N13128[dialog()]:::mth
  N13127 --> N13128
  N13129[getDialog()]:::mth
  N13127 --> N13129
  N13130[clearDialog()]:::mth
  N13127 --> N13130
  N13131[networkConditions()]:::mth
  N13127 --> N13131
  N13132[cpuThrottlingRate()]:::mth
  N13127 --> N13132
  N13133[Class: McpPage]:::cls
  N13126 --> N13133
  N13134[dialog()]:::mth
  N13133 --> N13134
  N13135[getDialog()]:::mth
  N13133 --> N13135
  N13136[clearDialog()]:::mth
  N13133 --> N13136
  N13137[networkConditions()]:::mth
  N13133 --> N13137
  N13138[cpuThrottlingRate()]:::mth
  N13133 --> N13138
  N13139[File: McpResponse.ts]:::file
  N11970 --> N13139
  N13140[Class: McpResponse]:::cls
  N13139 --> N13140
  N13141[setPage()]:::mth
  N13140 --> N13141
  N13142[attachDevToolsData()]:::mth
  N13140 --> N13142
  N13143[setTabId()]:::mth
  N13140 --> N13143
  N13144[setIncludePages()]:::mth
  N13140 --> N13144
  N13145[includeSnapshot()]:::mth
  N13140 --> N13145
  N13146[File: Mutex.ts]:::file
  N11970 --> N13146
  N13147[Class: Mutex]:::cls
  N13146 --> N13147
  N13148[dispose()]:::mth
  N13147 --> N13148
  N13149[acquire()]:::mth
  N13147 --> N13149
  N13150[release()]:::mth
  N13147 --> N13150
  N13151[Class: Guard]:::cls
  N13146 --> N13151
  N13152[dispose()]:::mth
  N13151 --> N13152
  N13153[acquire()]:::mth
  N13151 --> N13153
  N13154[release()]:::mth
  N13151 --> N13154
  N13155[File: PageCollector.ts]:::file
  N11970 --> N13155
  N13156[Class: UncaughtError]:::cls
  N13155 --> N13156
  N13157[createIdGenerator()]:::mth
  N13156 --> N13157
  N13158[init()]:::mth
  N13156 --> N13158
  N13159[dispose()]:::mth
  N13156 --> N13159
  N13160[addPage()]:::mth
  N13156 --> N13160
  N13161[splitAfterNavigation()]:::mth
  N13156 --> N13161
  N13162[Class: PageCollector]:::cls
  N13155 --> N13162
  N13163[createIdGenerator()]:::mth
  N13162 --> N13163
  N13164[init()]:::mth
  N13162 --> N13164
  N13165[dispose()]:::mth
  N13162 --> N13165
  N13166[addPage()]:::mth
  N13162 --> N13166
  N13167[splitAfterNavigation()]:::mth
  N13162 --> N13167
  N13168[Class: ConsoleCollector]:::cls
  N13155 --> N13168
  N13169[createIdGenerator()]:::mth
  N13168 --> N13169
  N13170[init()]:::mth
  N13168 --> N13170
  N13171[dispose()]:::mth
  N13168 --> N13171
  N13172[addPage()]:::mth
  N13168 --> N13172
  N13173[splitAfterNavigation()]:::mth
  N13168 --> N13173
  N13174[Class: PageEventSubscriber]:::cls
  N13155 --> N13174
  N13175[createIdGenerator()]:::mth
  N13174 --> N13175
  N13176[init()]:::mth
  N13174 --> N13176
  N13177[dispose()]:::mth
  N13174 --> N13177
  N13178[addPage()]:::mth
  N13174 --> N13178
  N13179[splitAfterNavigation()]:::mth
  N13174 --> N13179
  N13180[Class: NetworkCollector]:::cls
  N13155 --> N13180
  N13181[createIdGenerator()]:::mth
  N13180 --> N13181
  N13182[init()]:::mth
  N13180 --> N13182
  N13183[dispose()]:::mth
  N13180 --> N13183
  N13184[addPage()]:::mth
  N13180 --> N13184
  N13185[splitAfterNavigation()]:::mth
  N13180 --> N13185
  N13186[File: SlimMcpResponse.ts]:::file
  N11970 --> N13186
  N13187[Class: SlimMcpResponse]:::cls
  N13186 --> N13187
  N13188[handle()]:::mth
  N13187 --> N13188
  N13189[File: WaitForHelper.ts]:::file
  N11970 --> N13189
  N13190[Class: WaitForHelper]:::cls
  N13189 --> N13190
  N13191[waitForStableDom()]:::mth
  N13190 --> N13191
  N13192[callback()]:::mth
  N13190 --> N13192
  N13193[waitForNavigationStarted()]:::mth
  N13190 --> N13193
  N13194[timeout()]:::mth
  N13190 --> N13194
  N13206[File: ConsoleFormatter.ts]:::file
  N11970 --> N13206
  N13207[Class: ConsoleFormatter]:::cls
  N13206 --> N13207
  N13208[from()]:::mth
  N13207 --> N13208
  N13209[toString()]:::mth
  N13207 --> N13209
  N13210[toStringDetailed()]:::mth
  N13207 --> N13210
  N13211[toJSON()]:::mth
  N13207 --> N13211
  N13212[toJSONDetailed()]:::mth
  N13207 --> N13212
  N13213[File: IssueFormatter.ts]:::file
  N11970 --> N13213
  N13214[Class: IssueFormatter]:::cls
  N13213 --> N13214
  N13215[toString()]:::mth
  N13214 --> N13215
  N13216[toStringDetailed()]:::mth
  N13214 --> N13216
  N13217[toJSON()]:::mth
  N13214 --> N13217
  N13218[toJSONDetailed()]:::mth
  N13214 --> N13218
  N13219[isValid()]:::mth
  N13214 --> N13219
  N13220[File: NetworkFormatter.ts]:::file
  N11970 --> N13220
  N13221[Class: NetworkFormatter]:::cls
  N13220 --> N13221
  N13222[from()]:::mth
  N13221 --> N13222
  N13223[toString()]:::mth
  N13221 --> N13223
  N13224[toStringDetailed()]:::mth
  N13221 --> N13224
  N13225[toJSON()]:::mth
  N13221 --> N13225
  N13226[toJSONDetailed()]:::mth
  N13221 --> N13226
  N13227[File: SnapshotFormatter.ts]:::file
  N11970 --> N13227
  N13228[Class: SnapshotFormatter]:::cls
  N13227 --> N13228
  N13229[toString()]:::mth
  N13228 --> N13229
  N13230[toJSON()]:::mth
  N13228 --> N13230
  N13235[File: ClearcutLogger.ts]:::file
  N11970 --> N13235
  N13236[Class: ClearcutLogger]:::cls
  N13235 --> N13236
  N13237[detectOsType()]:::mth
  N13236 --> N13237
  N13238[logToolInvocation()]:::mth
  N13236 --> N13238
  N13239[logServerStart()]:::mth
  N13236 --> N13239
  N13240[logDailyActiveIfNeeded()]:::mth
  N13236 --> N13240
  N13241[File: WatchdogClient.ts]:::file
  N11970 --> N13241
  N13242[Class: WatchdogClient]:::cls
  N13241 --> N13242
  N13243[send()]:::mth
  N13242 --> N13243
  N13246[File: persistence.ts]:::file
  N11970 --> N13246
  N13247[Class: FilePersistence]:::cls
  N13246 --> N13247
  N13248[getDataFolder()]:::mth
  N13247 --> N13248
  N13249[loadState()]:::mth
  N13247 --> N13249
  N13250[loadState()]:::mth
  N13247 --> N13250
  N13251[saveState()]:::mth
  N13247 --> N13251
  N13253[File: ClearcutSender.ts]:::file
  N11970 --> N13253
  N13254[Class: ClearcutSender]:::cls
  N13253 --> N13254
  N13255[enqueueEvent()]:::mth
  N13254 --> N13255
  N13256[sendShutdownEvent()]:::mth
  N13254 --> N13256
  N13257[stopForTesting()]:::mth
  N13254 --> N13257
  N13258[bufferSizeForTesting()]:::mth
  N13254 --> N13258
  N13281[File: ExtensionRegistry.ts]:::file
  N11970 --> N13281
  N13282[Class: ExtensionRegistry]:::cls
  N13281 --> N13282
  N13283[registerExtension()]:::mth
  N13282 --> N13283
  N13284[remove()]:::mth
  N13282 --> N13284
  N13285[list()]:::mth
  N13282 --> N13285
  N13286[getById()]:::mth
  N13282 --> N13286
  N13308[File: server.ts]:::file
  N11970 --> N13308
  N13309[Class: TestServer]:::cls
  N13308 --> N13309
  N13310[randomPort()]:::mth
  N13309 --> N13310
  N13311[baseUrl()]:::mth
  N13309 --> N13311
  N13312[getRoute()]:::mth
  N13309 --> N13312
  N13313[addHtmlRoute()]:::mth
  N13309 --> N13313
  N13314[restore()]:::mth
  N13309 --> N13314
  N13342[File: configValidate.ts]:::file
  N11970 --> N13342
  N13343[Class: ConfigValidateAPI]:::cls
  N13342 --> N13343
  N13344[validateConfig()]:::mth
  N13343 --> N13344
  N13345[File: deploys.ts]:::file
  N11970 --> N13345
  N13346[Class: DeploysAPI]:::cls
  N13345 --> N13346
  N13347[runRollbackPipeline()]:::mth
  N13346 --> N13347
  N13348[fetchComponentVersions()]:::mth
  N13346 --> N13348
  N13349[fetchEnvironments()]:::mth
  N13346 --> N13349
  N13350[fetchProjectComponents()]:::mth
  N13346 --> N13350
  N13351[fetchProjectDeploySettings()]:::mth
  N13346 --> N13351
  N13353[File: httpClient.ts]:::file
  N11970 --> N13353
  N13354[Class: HTTPClient]:::cls
  N13353 --> N13354
  N13355[buildURL()]:::mth
  N13354 --> N13355
  N13356[File: index.ts]:::file
  N11970 --> N13356
  N13357[Class: CircleCIClients]:::cls
  N13356 --> N13357
  N13358[createCircleCIHeaders()]:::mth
  N13357 --> N13358
  N13359[File: insights.ts]:::file
  N11970 --> N13359
  N13360[Class: InsightsAPI]:::cls
  N13359 --> N13360
  N13361[getProjectFlakyTests()]:::mth
  N13360 --> N13361
  N13362[File: jobs.ts]:::file
  N11970 --> N13362
  N13363[Class: JobsAPI]:::cls
  N13362 --> N13363
  N13364[getJobByNumber()]:::mth
  N13363 --> N13364
  N13365[getWorkflowJobs()]:::mth
  N13363 --> N13365
  N13366[File: jobsV1.ts]:::file
  N11970 --> N13366
  N13367[Class: JobsV1API]:::cls
  N13366 --> N13367
  N13368[getJobDetails()]:::mth
  N13367 --> N13368
  N13369[File: pipelines.ts]:::file
  N11970 --> N13369
  N13370[Class: PipelinesAPI]:::cls
  N13369 --> N13370
  N13371[getPipelines()]:::mth
  N13370 --> N13371
  N13372[getPipelineByNumber()]:::mth
  N13370 --> N13372
  N13373[getPipelineDefinitions()]:::mth
  N13370 --> N13373
  N13374[runPipeline()]:::mth
  N13370 --> N13374
  N13375[File: projects.ts]:::file
  N11970 --> N13375
  N13376[Class: ProjectsAPI]:::cls
  N13375 --> N13376
  N13377[getProject()]:::mth
  N13376 --> N13377
  N13378[getProjectByID()]:::mth
  N13376 --> N13378
  N13379[File: tests.ts]:::file
  N11970 --> N13379
  N13380[Class: TestsAPI]:::cls
  N13379 --> N13380
  N13381[getJobTests()]:::mth
  N13380 --> N13381
  N13382[File: usage.ts]:::file
  N11970 --> N13382
  N13383[Class: UsageAPI]:::cls
  N13382 --> N13383
  N13384[startUsageExportJob()]:::mth
  N13383 --> N13384
  N13385[getUsageExportJobStatus()]:::mth
  N13383 --> N13385
  N13386[File: workflows.ts]:::file
  N11970 --> N13386
  N13387[Class: WorkflowsAPI]:::cls
  N13386 --> N13387
  N13388[getPipelineWorkflows()]:::mth
  N13387 --> N13388
  N13389[getWorkflow()]:::mth
  N13387 --> N13389
  N13390[rerunWorkflow()]:::mth
  N13387 --> N13390
  N13391[File: index.ts]:::file
  N11970 --> N13391
  N13392[Class: CircleCIPrivateClients]:::cls
  N13391 --> N13392
  N13393[File: jobsPrivate.ts]:::file
  N11970 --> N13393
  N13394[Class: JobsPrivate]:::cls
  N13393 --> N13394
  N13395[getStepOutput()]:::mth
  N13394 --> N13395
  N13396[File: me.ts]:::file
  N11970 --> N13396
  N13397[Class: MeAPI]:::cls
  N13396 --> N13397
  N13398[getFollowedProjects()]:::mth
  N13397 --> N13398
  N13399[File: circlet.ts]:::file
  N11970 --> N13399
  N13400[Class: CircletAPI]:::cls
  N13399 --> N13400
  N13401[createPromptTemplate()]:::mth
  N13400 --> N13401
  N13402[recommendPromptTemplateTests()]:::mth
  N13400 --> N13402
  N13403[ruleReview()]:::mth
  N13400 --> N13403
  N13404[File: index.ts]:::file
  N11970 --> N13404
  N13405[Class: CircletClient]:::cls
  N13404 --> N13405
  N13426[File: vcsTool.ts]:::file
  N11970 --> N13426
  N13427[Class: UnhandledVCS]:::cls
  N13426 --> N13427
  N13428[getVCSFromHost()]:::mth
  N13427 --> N13428
  N13429[mustGetVCSFromHost()]:::mth
  N13427 --> N13429
  N13430[getVCSFromName()]:::mth
  N13427 --> N13430
  N13431[mustGetVCSFromName()]:::mth
  N13427 --> N13431
  N13432[getVCSFromShort()]:::mth
  N13427 --> N13432
  N13442[File: handler.test.ts]:::file
  N11970 --> N13442
  N13443[Class: Component]:::cls
  N13442 --> N13443
  N13444[Class: Component]:::cls
  N13442 --> N13444
  N13510[File: unified.ts]:::file
  N11970 --> N13510
  N13511[Class: that]:::cls
  N13510 --> N13511
  N13512[send()]:::mth
  N13511 --> N13512
  N13513[Class: DebugSSETransport]:::cls
  N13510 --> N13513
  N13514[send()]:::mth
  N13513 --> N13514
  N13571[File: kubernetes-manager.ts]:::file
  N11970 --> N13571
  N13572[Class: KubernetesManager]:::cls
  N13571 --> N13572
  N13573[isRunningInCluster()]:::mth
  N13572 --> N13573
  N13574[hasEnvKubeconfigYaml()]:::mth
  N13572 --> N13574
  N13575[hasEnvKubeconfigJson()]:::mth
  N13572 --> N13575
  N13576[hasEnvMinimalKubeconfig()]:::mth
  N13572 --> N13576
  N13577[loadEnvKubeconfigPath()]:::mth
  N13572 --> N13577
  N13607[File: telemetry-integration.test.ts]:::file
  N11970 --> N13607
  N13608[Class: CustomError]:::cls
  N13607 --> N13608
  N13610[File: vitest.config.ts]:::file
  N11970 --> N13610
  N13611[Class: KubectlSequencer]:::cls
  N13610 --> N13611
  N13612[sort()]:::mth
  N13611 --> N13612
  N13643[File: binaryValidator.ts]:::file
  N11970 --> N13643
  N13644[Class: BinaryValidationError]:::cls
  N13643 --> N13644
  N13645[validateBinaryPath()]:::mth
  N13644 --> N13645
  N13646[calculateBinaryHash()]:::mth
  N13644 --> N13646
  N13647[validateBinaryIntegrity()]:::mth
  N13644 --> N13647
  N13648[validateBinarySecurity()]:::mth
  N13644 --> N13648
  N13649[findSecureBinaryPath()]:::mth
  N13644 --> N13649
  N13651[File: calendarRepository.ts]:::file
  N11970 --> N13651
  N13652[Class: CalendarRepository]:::cls
  N13651 --> N13652
  N13653[readEvents()]:::mth
  N13652 --> N13653
  N13654[findEventById()]:::mth
  N13652 --> N13654
  N13655[findEvents()]:::mth
  N13652 --> N13655
  N13656[findAllCalendars()]:::mth
  N13652 --> N13656
  N13657[createEvent()]:::mth
  N13652 --> N13657
  N13658[Class: for]:::cls
  N13651 --> N13658
  N13659[readEvents()]:::mth
  N13658 --> N13659
  N13660[findEventById()]:::mth
  N13658 --> N13660
  N13661[findEvents()]:::mth
  N13658 --> N13661
  N13662[findAllCalendars()]:::mth
  N13658 --> N13662
  N13663[createEvent()]:::mth
  N13658 --> N13663
  N13665[File: cliExecutor.ts]:::file
  N11970 --> N13665
  N13666[Class: for]:::cls
  N13665 --> N13666
  N13667[clearBinaryPathCache()]:::mth
  N13666 --> N13667
  N13668[detectPermissionError()]:::mth
  N13666 --> N13668
  N13669[Class: CliPermissionError]:::cls
  N13665 --> N13669
  N13670[clearBinaryPathCache()]:::mth
  N13669 --> N13670
  N13671[detectPermissionError()]:::mth
  N13669 --> N13671
  N13673[File: dateFiltering.test.ts]:::file
  N11970 --> N13673
  N13674[Class: extends]:::cls
  N13673 --> N13674
  N13675[createReminder()]:::mth
  N13674 --> N13675
  N13676[now()]:::mth
  N13674 --> N13676
  N13681[File: errorHandling.ts]:::file
  N11970 --> N13681
  N13682[Class: for]:::cls
  N13681 --> N13682
  N13683[isUserActionablePermissionError()]:::mth
  N13682 --> N13683
  N13684[isDevelopmentMode()]:::mth
  N13682 --> N13684
  N13685[createErrorMessage()]:::mth
  N13682 --> N13685
  N13686[Class: CliUserError]:::cls
  N13681 --> N13686
  N13687[isUserActionablePermissionError()]:::mth
  N13686 --> N13687
  N13688[isDevelopmentMode()]:::mth
  N13686 --> N13688
  N13689[createErrorMessage()]:::mth
  N13686 --> N13689
  N13696[File: reminderRepository.ts]:::file
  N11970 --> N13696
  N13697[Class: ReminderRepository]:::cls
  N13696 --> N13697
  N13698[mapReminder()]:::mth
  N13697 --> N13698
  N13699[mapReminders()]:::mth
  N13697 --> N13699
  N13700[findReminderById()]:::mth
  N13697 --> N13700
  N13701[findReminders()]:::mth
  N13697 --> N13701
  N13702[findAllLists()]:::mth
  N13697 --> N13702
  N13703[Class: for]:::cls
  N13696 --> N13703
  N13704[mapReminder()]:::mth
  N13703 --> N13704
  N13705[mapReminders()]:::mth
  N13703 --> N13705
  N13706[findReminderById()]:::mth
  N13703 --> N13706
  N13707[findReminders()]:::mth
  N13703 --> N13707
  N13708[findAllLists()]:::mth
  N13703 --> N13708
  N13717[File: schemas.ts]:::file
  N11970 --> N13717
  N13718[Class: ValidationError]:::cls
  N13717 --> N13718
  N13719[isBlockedHostname()]:::mth
  N13718 --> N13719
  N13720[isBlockedIPv4()]:::mth
  N13718 --> N13720
  N13721[createSafeTextSchema()]:::mth
  N13718 --> N13721
  N13729[File: progressUtils.ts]:::file
  N11970 --> N13729
  N13730[Class: ProgressManager]:::cls
  N13729 --> N13730
  N13731[sendInitialProgress()]:::mth
  N13730 --> N13731
  N13732[sendPreparingProgress()]:::mth
  N13730 --> N13732
  N13733[startProcessingProgress()]:::mth
  N13730 --> N13733
  N13734[stopProcessingProgress()]:::mth
  N13730 --> N13734
  N13735[sendSavingProgress()]:::mth
  N13730 --> N13735
  N13737[File: CollectBlock.ts]:::file
  N11970 --> N13737
  N13738[Class: CollectBlock]:::cls
  N13737 --> N13738
  N13739[collectAll()]:::mth
  N13738 --> N13739
  N13740[mineBlock()]:::mth
  N13738 --> N13740
  N13741[collect()]:::mth
  N13738 --> N13741
  N13742[findFromVein()]:::mth
  N13738 --> N13742
  N13743[cancelTask()]:::mth
  N13738 --> N13743
  N13745[File: Targets.ts]:::file
  N11970 --> N13745
  N13746[Class: Targets]:::cls
  N13745 --> N13746
  N13747[appendTargets()]:::mth
  N13746 --> N13747
  N13748[appendTarget()]:::mth
  N13746 --> N13748
  N13749[getClosest()]:::mth
  N13746 --> N13749
  N13750[empty()]:::mth
  N13746 --> N13750
  N13751[clear()]:::mth
  N13746 --> N13751
  N13752[File: TaskQueue.ts]:::file
  N11970 --> N13752
  N13753[Class: for]:::cls
  N13752 --> N13753
  N13754[add()]:::mth
  N13753 --> N13754
  N13755[addSync()]:::mth
  N13753 --> N13755
  N13756[runAll()]:::mth
  N13753 --> N13756
  N13757[Class: TaskQueue]:::cls
  N13752 --> N13757
  N13758[add()]:::mth
  N13757 --> N13758
  N13759[addSync()]:::mth
  N13757 --> N13759
  N13760[runAll()]:::mth
  N13757 --> N13760
  N13761[File: TemporarySubscriber.ts]:::file
  N11970 --> N13761
  N13762[Class: Subscription]:::cls
  N13761 --> N13762
  N13763[subscribeTo()]:::mth
  N13762 --> N13763
  N13764[cleanup()]:::mth
  N13762 --> N13764
  N13765[Class: TemporarySubscriber]:::cls
  N13761 --> N13765
  N13766[subscribeTo()]:::mth
  N13765 --> N13766
  N13767[cleanup()]:::mth
  N13765 --> N13767
  N13807[File: acp-telemetry.test.ts]:::file
  N11970 --> N13807
  N13808[Class: SessionUpdateCollector]:::cls
  N13807 --> N13808
  N13809[async()]:::mth
  N13808 --> N13809
  N13823[File: mcp_server_cyclic_schema.test.ts]:::file
  N11970 --> N13823
  N13824[Class: SimpleJSONRPC]:::cls
  N13823 --> N13824
  N13825[debug()]:::mth
  N13824 --> N13825
  N13826[send()]:::mth
  N13824 --> N13826
  N13827[handleMessage()]:::mth
  N13824 --> N13827
  N13828[on()]:::mth
  N13824 --> N13828
  N13832[File: ripgrep-real.test.ts]:::file
  N11970 --> N13832
  N13833[Class: MockConfig]:::cls
  N13832 --> N13833
  N13834[getTargetDir()]:::mth
  N13833 --> N13834
  N13835[getWorkspaceContext()]:::mth
  N13833 --> N13835
  N13836[getDebugMode()]:::mth
  N13833 --> N13836
  N13837[getFileFilteringRespectGeminiIgnore()]:::mth
  N13833 --> N13837
  N13839[File: simple-mcp-server.test.ts]:::file
  N11970 --> N13839
  N13840[Class: SimpleJSONRPC]:::cls
  N13839 --> N13840
  N13841[debug()]:::mth
  N13840 --> N13841
  N13842[send()]:::mth
  N13840 --> N13842
  N13843[handleMessage()]:::mth
  N13840 --> N13843
  N13844[on()]:::mth
  N13840 --> N13844
  N13850[File: test-mcp-server.ts]:::file
  N11970 --> N13850
  N13851[Class: TestMcpServer]:::cls
  N13850 --> N13851
  N13852[start()]:::mth
  N13851 --> N13852
  N13853[stop()]:::mth
  N13851 --> N13853
  N13858[File: executor.ts]:::file
  N11970 --> N13858
  N13859[Class: inside]:::cls
  N13858 --> N13859
  N13860[id()]:::mth
  N13859 --> N13860
  N13861[toSDKTask()]:::mth
  N13859 --> N13861
  N13862[getConfig()]:::mth
  N13859 --> N13862
  N13863[reconstruct()]:::mth
  N13859 --> N13863
  N13864[createTask()]:::mth
  N13859 --> N13864
  N13865[Class: TaskWrapper]:::cls
  N13858 --> N13865
  N13866[id()]:::mth
  N13865 --> N13866
  N13867[toSDKTask()]:::mth
  N13865 --> N13867
  N13868[getConfig()]:::mth
  N13865 --> N13868
  N13869[reconstruct()]:::mth
  N13865 --> N13869
  N13870[createTask()]:::mth
  N13865 --> N13870
  N13871[Class: CoderAgentExecutor]:::cls
  N13858 --> N13871
  N13872[id()]:::mth
  N13871 --> N13872
  N13873[toSDKTask()]:::mth
  N13871 --> N13873
  N13874[getConfig()]:::mth
  N13871 --> N13874
  N13875[reconstruct()]:::mth
  N13871 --> N13875
  N13876[createTask()]:::mth
  N13871 --> N13876
  N13878[File: task.ts]:::file
  N11970 --> N13878
  N13879[Class: Task]:::cls
  N13878 --> N13879
  N13880[create()]:::mth
  N13879 --> N13880
  N13881[getMetadata()]:::mth
  N13879 --> N13881
  N13882[_resetToolCompletionPromise()]:::mth
  N13879 --> N13882
  N13883[_registerToolCall()]:::mth
  N13879 --> N13883
  N13884[_resolveToolCall()]:::mth
  N13879 --> N13884
  N13886[File: command-registry.ts]:::file
  N11970 --> N13886
  N13887[Class: CommandRegistry]:::cls
  N13886 --> N13887
  N13888[initialize()]:::mth
  N13887 --> N13888
  N13889[register()]:::mth
  N13887 --> N13889
  N13890[get()]:::mth
  N13887 --> N13890
  N13891[getAllCommands()]:::mth
  N13887 --> N13891
  N13893[File: extensions.ts]:::file
  N11970 --> N13893
  N13894[Class: ExtensionsCommand]:::cls
  N13893 --> N13894
  N13895[execute()]:::mth
  N13894 --> N13895
  N13896[execute()]:::mth
  N13894 --> N13896
  N13897[Class: ListExtensionsCommand]:::cls
  N13893 --> N13897
  N13898[execute()]:::mth
  N13897 --> N13898
  N13899[execute()]:::mth
  N13897 --> N13899
  N13901[File: init.ts]:::file
  N11970 --> N13901
  N13902[Class: InitCommand]:::cls
  N13901 --> N13902
  N13903[handleMessageResult()]:::mth
  N13902 --> N13903
  N13904[handleSubmitPromptResult()]:::mth
  N13902 --> N13904
  N13905[execute()]:::mth
  N13902 --> N13905
  N13907[File: memory.ts]:::file
  N11970 --> N13907
  N13908[Class: MemoryCommand]:::cls
  N13907 --> N13908
  N13909[execute()]:::mth
  N13908 --> N13909
  N13910[execute()]:::mth
  N13908 --> N13910
  N13911[execute()]:::mth
  N13908 --> N13911
  N13912[execute()]:::mth
  N13908 --> N13912
  N13913[execute()]:::mth
  N13908 --> N13913
  N13914[Class: ShowMemoryCommand]:::cls
  N13907 --> N13914
  N13915[execute()]:::mth
  N13914 --> N13915
  N13916[execute()]:::mth
  N13914 --> N13916
  N13917[execute()]:::mth
  N13914 --> N13917
  N13918[execute()]:::mth
  N13914 --> N13918
  N13919[execute()]:::mth
  N13914 --> N13919
  N13920[Class: RefreshMemoryCommand]:::cls
  N13907 --> N13920
  N13921[execute()]:::mth
  N13920 --> N13921
  N13922[execute()]:::mth
  N13920 --> N13922
  N13923[execute()]:::mth
  N13920 --> N13923
  N13924[execute()]:::mth
  N13920 --> N13924
  N13925[execute()]:::mth
  N13920 --> N13925
  N13926[Class: ListMemoryCommand]:::cls
  N13907 --> N13926
  N13927[execute()]:::mth
  N13926 --> N13927
  N13928[execute()]:::mth
  N13926 --> N13928
  N13929[execute()]:::mth
  N13926 --> N13929
  N13930[execute()]:::mth
  N13926 --> N13930
  N13931[execute()]:::mth
  N13926 --> N13931
  N13932[Class: AddMemoryCommand]:::cls
  N13907 --> N13932
  N13933[execute()]:::mth
  N13932 --> N13933
  N13934[execute()]:::mth
  N13932 --> N13934
  N13935[execute()]:::mth
  N13932 --> N13935
  N13936[execute()]:::mth
  N13932 --> N13936
  N13937[execute()]:::mth
  N13932 --> N13937
  N13939[File: restore.ts]:::file
  N11970 --> N13939
  N13940[Class: RestoreCommand]:::cls
  N13939 --> N13940
  N13941[execute()]:::mth
  N13940 --> N13941
  N13942[await()]:::mth
  N13940 --> N13942
  N13943[execute()]:::mth
  N13940 --> N13943
  N13944[Class: ListCheckpointsCommand]:::cls
  N13939 --> N13944
  N13945[execute()]:::mth
  N13944 --> N13945
  N13946[await()]:::mth
  N13944 --> N13946
  N13947[execute()]:::mth
  N13944 --> N13947
  N13949[File: config.test.ts]:::file
  N11970 --> N13949
  N13950[Class: MockConfig]:::cls
  N13949 --> N13950
  N13952[File: extension.ts]:::file
  N11970 --> N13952
  N13953[Class: defined]:::cls
  N13952 --> N13953
  N13954[loadExtensions()]:::mth
  N13953 --> N13954
  N13955[loadExtensionsFromDir()]:::mth
  N13953 --> N13955
  N13956[loadExtension()]:::mth
  N13953 --> N13956
  N13957[getContextFileNames()]:::mth
  N13953 --> N13957
  N13958[loadInstallMetadata()]:::mth
  N13953 --> N13958
  N13963[File: endpoints.test.ts]:::file
  N11970 --> N13963
  N13964[Class: MockTask]:::cls
  N13963 --> N13964
  N13969[File: gcs.ts]:::file
  N11970 --> N13969
  N13970[Class: GCSTaskStore]:::cls
  N13969 --> N13970
  N13971[initializeBucket()]:::mth
  N13970 --> N13971
  N13972[ensureBucketInitialized()]:::mth
  N13970 --> N13972
  N13973[getObjectPath()]:::mth
  N13970 --> N13973
  N13974[save()]:::mth
  N13970 --> N13974
  N13975[load()]:::mth
  N13970 --> N13975
  N13976[Class: NoOpTaskStore]:::cls
  N13969 --> N13976
  N13977[initializeBucket()]:::mth
  N13976 --> N13977
  N13978[ensureBucketInitialized()]:::mth
  N13976 --> N13978
  N13979[getObjectPath()]:::mth
  N13976 --> N13979
  N13980[save()]:::mth
  N13976 --> N13980
  N13981[load()]:::mth
  N13976 --> N13981
  N13992[File: enable.test.ts]:::file
  N11970 --> N13992
  N13993[Class: extends]:::cls
  N13992 --> N13993
  N14040[File: extension-manager.ts]:::file
  N11970 --> N14040
  N14041[Class: ExtensionManager]:::cls
  N14040 --> N14041
  N14042[getExtensions()]:::mth
  N14041 --> N14042
  N14043[installOrUpdateExtension()]:::mth
  N14041 --> N14043
  N14044[getMissingSettings()]:::mth
  N14041 --> N14044
  N14045[getExtensionId()]:::mth
  N14041 --> N14045
  N14046[uninstallExtension()]:::mth
  N14041 --> N14046
  N14048[File: extension.ts]:::file
  N11970 --> N14048
  N14049[Class: defined]:::cls
  N14048 --> N14049
  N14050[loadInstallMetadata()]:::mth
  N14049 --> N14050
  N14054[File: extensionEnablement.ts]:::file
  N11970 --> N14054
  N14055[Class: Override]:::cls
  N14054 --> N14055
  N14056[fromInput()]:::mth
  N14055 --> N14056
  N14057[fromFileRule()]:::mth
  N14055 --> N14057
  N14058[conflictsWith()]:::mth
  N14055 --> N14058
  N14059[isEqualTo()]:::mth
  N14055 --> N14059
  N14060[asRegex()]:::mth
  N14055 --> N14060
  N14061[Class: ExtensionEnablementManager]:::cls
  N14054 --> N14061
  N14062[fromInput()]:::mth
  N14061 --> N14062
  N14063[fromFileRule()]:::mth
  N14061 --> N14063
  N14064[conflictsWith()]:::mth
  N14061 --> N14064
  N14065[isEqualTo()]:::mth
  N14061 --> N14065
  N14066[asRegex()]:::mth
  N14061 --> N14066
  N14075[File: storage.ts]:::file
  N11970 --> N14075
  N14076[Class: ExtensionStorage]:::cls
  N14075 --> N14076
  N14077[getExtensionDir()]:::mth
  N14076 --> N14077
  N14078[getConfigPath()]:::mth
  N14076 --> N14078
  N14079[getEnvFilePath()]:::mth
  N14076 --> N14079
  N14080[getUserExtensionsDir()]:::mth
  N14076 --> N14080
  N14081[createTmpDir()]:::mth
  N14076 --> N14081
  N14082[File: update.test.ts]:::file
  N11970 --> N14082
  N14083[Class: implementation]:::cls
  N14082 --> N14083
  N14092[File: sandboxConfig.test.ts]:::file
  N11970 --> N14092
  N14093[Class: extends]:::cls
  N14092 --> N14093
  N14100[File: settings.ts]:::file
  N11970 --> N14100
  N14101[Class: LoadedSettings]:::cls
  N14100 --> N14101
  N14102[getMergeStrategyForPath()]:::mth
  N14101 --> N14102
  N14103[getSystemSettingsPath()]:::mth
  N14101 --> N14103
  N14104[getSystemDefaultsPath()]:::mth
  N14101 --> N14104
  N14105[isLoadableSettingScope()]:::mth
  N14101 --> N14105
  N14106[setNestedProperty()]:::mth
  N14101 --> N14106
  N14110[File: settings_validation_warning.test.ts]:::file
  N11970 --> N14110
  N14111[Class: extends]:::cls
  N14110 --> N14111
  N14114[File: trustedFolders.ts]:::file
  N11970 --> N14114
  N14115[Class: LoadedTrustedFolders]:::cls
  N14114 --> N14115
  N14116[getUserSettingsDir()]:::mth
  N14115 --> N14116
  N14117[getTrustedFoldersPath()]:::mth
  N14115 --> N14117
  N14118[isTrustLevel()]:::mth
  N14115 --> N14118
  N14119[rules()]:::mth
  N14115 --> N14119
  N14120[isPathTrusted()]:::mth
  N14115 --> N14120
  N14130[File: nonInteractiveCli.test.ts]:::file
  N11970 --> N14130
  N14131[Class: MockChatRecordingService]:::cls
  N14130 --> N14131
  N14132[createStreamFromEvents()]:::mth
  N14131 --> N14132
  N14137[File: BuiltinCommandLoader.ts]:::file
  N11970 --> N14137
  N14138[Class: BuiltinCommandLoader]:::cls
  N14137 --> N14138
  N14139[loadCommands()]:::mth
  N14138 --> N14139
  N14140[async()]:::mth
  N14138 --> N14140
  N14141[async()]:::mth
  N14138 --> N14141
  N14142[async()]:::mth
  N14138 --> N14142
  N14143[File: CommandService.test.ts]:::file
  N11970 --> N14143
  N14144[Class: MockCommandLoader]:::cls
  N14143 --> N14144
  N14145[async()]:::mth
  N14144 --> N14145
  N14146[File: CommandService.ts]:::file
  N11970 --> N14146
  N14147[Class: CommandService]:::cls
  N14146 --> N14147
  N14148[create()]:::mth
  N14147 --> N14148
  N14149[getCommands()]:::mth
  N14147 --> N14149
  N14150[File: FileCommandLoader.test.ts]:::file
  N11970 --> N14150
  N14151[Class: extends]:::cls
  N14150 --> N14151
  N14152[File: FileCommandLoader.ts]:::file
  N11970 --> N14152
  N14153[Class: FileCommandLoader]:::cls
  N14152 --> N14153
  N14154[loadCommands()]:::mth
  N14153 --> N14154
  N14155[getCommandDirectories()]:::mth
  N14153 --> N14155
  N14156[parseAndAdaptFile()]:::mth
  N14153 --> N14156
  N14157[async()]:::mth
  N14153 --> N14157
  N14159[File: McpPromptLoader.ts]:::file
  N11970 --> N14159
  N14160[Class: McpPromptLoader]:::cls
  N14159 --> N14160
  N14161[loadCommands()]:::mth
  N14160 --> N14161
  N14162[async()]:::mth
  N14160 --> N14162
  N14163[async()]:::mth
  N14160 --> N14163
  N14164[parseArgs()]:::mth
  N14160 --> N14164
  N14165[Error()]:::mth
  N14160 --> N14165
  N14167[File: argumentProcessor.ts]:::file
  N11970 --> N14167
  N14168[Class: DefaultArgumentProcessor]:::cls
  N14167 --> N14168
  N14169[process()]:::mth
  N14168 --> N14169
  N14171[File: atFileProcessor.ts]:::file
  N11970 --> N14171
  N14172[Class: AtFileProcessor]:::cls
  N14171 --> N14172
  N14173[process()]:::mth
  N14172 --> N14173
  N14177[File: shellProcessor.ts]:::file
  N11970 --> N14177
  N14178[Class: ConfirmationRequiredError]:::cls
  N14177 --> N14178
  N14179[process()]:::mth
  N14178 --> N14179
  N14180[processString()]:::mth
  N14178 --> N14180
  N14181[Class: ShellProcessor]:::cls
  N14177 --> N14181
  N14182[process()]:::mth
  N14181 --> N14182
  N14183[processString()]:::mth
  N14181 --> N14183
  N14185[File: types.ts]:::file
  N11970 --> N14185
  N14186[Class: that]:::cls
  N14185 --> N14186
  N14270[File: editorSettingsManager.ts]:::file
  N11970 --> N14270
  N14271[Class: EditorSettingsManager]:::cls
  N14270 --> N14271
  N14272[getAvailableEditorDisplays()]:::mth
  N14271 --> N14272
  N14329[File: useQuotaAndFallback.test.ts]:::file
  N11970 --> N14329
  N14330[Class: for]:::cls
  N14329 --> N14330
  N14343[File: useShellHistory.test.ts]:::file
  N11970 --> N14343
  N14344[Class: Storage]:::cls
  N14343 --> N14344
  N14345[getGlobalSettingsPath()]:::mth
  N14344 --> N14345
  N14346[getProjectTempDir()]:::mth
  N14344 --> N14346
  N14347[getHistoryFilePath()]:::mth
  N14344 --> N14347
  N14348[file()]:::mth
  N14344 --> N14348
  N14385[File: theme-manager.ts]:::file
  N11970 --> N14385
  N14386[Class: ThemeManager]:::cls
  N14385 --> N14386
  N14387[loadCustomThemes()]:::mth
  N14386 --> N14387
  N14388[setActiveTheme()]:::mth
  N14386 --> N14388
  N14389[getActiveTheme()]:::mth
  N14386 --> N14389
  N14390[getSemanticColors()]:::mth
  N14386 --> N14390
  N14391[getCustomThemeNames()]:::mth
  N14386 --> N14391
  N14393[File: theme.ts]:::file
  N11970 --> N14393
  N14394[Class: Theme]:::cls
  N14393 --> N14394
  N14395[getInkColor()]:::mth
  N14394 --> N14395
  N14396[_resolveColor()]:::mth
  N14394 --> N14396
  N14397[_buildColorMap()]:::mth
  N14394 --> N14397
  N14398[createCustomTheme()]:::mth
  N14394 --> N14398
  N14399[validateCustomTheme()]:::mth
  N14394 --> N14399
  N14400[Class: names]:::cls
  N14393 --> N14400
  N14401[getInkColor()]:::mth
  N14400 --> N14401
  N14402[_resolveColor()]:::mth
  N14400 --> N14402
  N14403[_buildColorMap()]:::mth
  N14400 --> N14403
  N14404[createCustomTheme()]:::mth
  N14400 --> N14404
  N14405[validateCustomTheme()]:::mth
  N14400 --> N14405
  N14406[Class: name]:::cls
  N14393 --> N14406
  N14407[getInkColor()]:::mth
  N14406 --> N14407
  N14408[_resolveColor()]:::mth
  N14406 --> N14408
  N14409[_buildColorMap()]:::mth
  N14406 --> N14409
  N14410[createCustomTheme()]:::mth
  N14406 --> N14410
  N14411[validateCustomTheme()]:::mth
  N14406 --> N14411
  N14412[Class: name]:::cls
  N14393 --> N14412
  N14413[getInkColor()]:::mth
  N14412 --> N14413
  N14414[_resolveColor()]:::mth
  N14412 --> N14414
  N14415[_buildColorMap()]:::mth
  N14412 --> N14415
  N14416[createCustomTheme()]:::mth
  N14412 --> N14416
  N14417[validateCustomTheme()]:::mth
  N14412 --> N14417
  N14418[Class: names]:::cls
  N14393 --> N14418
  N14419[getInkColor()]:::mth
  N14418 --> N14419
  N14420[_resolveColor()]:::mth
  N14418 --> N14420
  N14421[_buildColorMap()]:::mth
  N14418 --> N14421
  N14422[createCustomTheme()]:::mth
  N14418 --> N14422
  N14423[validateCustomTheme()]:::mth
  N14418 --> N14423
  N14426[File: ConsolePatcher.ts]:::file
  N11970 --> N14426
  N14427[Class: ConsolePatcher]:::cls
  N14426 --> N14427
  N14428[patch()]:::mth
  N14427 --> N14428
  N14431[File: clipboardUtils.ts]:::file
  N11970 --> N14431
  N14432[Class: PNGf]:::cls
  N14431 --> N14432
  N14433[clipboardHasImage()]:::mth
  N14432 --> N14433
  N14434[saveClipboardImage()]:::mth
  N14432 --> N14434
  N14435[cleanupOldClipboardImages()]:::mth
  N14432 --> N14435
  N14436[splitEscapedPaths()]:::mth
  N14432 --> N14436
  N14437[Class: JPEG]:::cls
  N14431 --> N14437
  N14438[clipboardHasImage()]:::mth
  N14437 --> N14438
  N14439[saveClipboardImage()]:::mth
  N14437 --> N14439
  N14440[cleanupOldClipboardImages()]:::mth
  N14437 --> N14440
  N14441[splitEscapedPaths()]:::mth
  N14437 --> N14441
  N14442[Class: TIFF]:::cls
  N14431 --> N14442
  N14443[clipboardHasImage()]:::mth
  N14442 --> N14443
  N14444[saveClipboardImage()]:::mth
  N14442 --> N14444
  N14445[cleanupOldClipboardImages()]:::mth
  N14442 --> N14445
  N14446[splitEscapedPaths()]:::mth
  N14442 --> N14446
  N14459[File: highlight.ts]:::file
  N11970 --> N14459
  N14460[Class: to]:::cls
  N14459 --> N14460
  N14461[parseInputForHighlighting()]:::mth
  N14460 --> N14461
  N14462[parseSegmentsFromTokens()]:::mth
  N14460 --> N14462
  N14474[File: terminalCapabilityManager.ts]:::file
  N11970 --> N14474
  N14475[Class: TerminalCapabilityManager]:::cls
  N14474 --> N14475
  N14476[getInstance()]:::mth
  N14475 --> N14476
  N14477[resetInstanceForTesting()]:::mth
  N14475 --> N14477
  N14478[detectCapabilities()]:::mth
  N14475 --> N14478
  N14479[enableSupportedModes()]:::mth
  N14475 --> N14479
  N14480[getTerminalBackgroundColor()]:::mth
  N14475 --> N14480
  N14484[File: textOutput.ts]:::file
  N11970 --> N14484
  N14485[Class: TextOutput]:::cls
  N14484 --> N14485
  N14486[write()]:::mth
  N14485 --> N14486
  N14487[writeOnNewLine()]:::mth
  N14485 --> N14487
  N14488[ensureTrailingNewline()]:::mth
  N14485 --> N14488
  N14495[File: activityLogger.ts]:::file
  N11970 --> N14495
  N14496[Class: ActivityLogger]:::cls
  N14495 --> N14496
  N14497[getInstance()]:::mth
  N14496 --> N14497
  N14498[stringifyHeaders()]:::mth
  N14496 --> N14498
  N14499[sanitizeNetworkLog()]:::mth
  N14496 --> N14499
  N14500[safeEmitNetwork()]:::mth
  N14496 --> N14500
  N14501[enable()]:::mth
  N14496 --> N14501
  N14519[File: errors.test.ts]:::file
  N11970 --> N14519
  N14520[Class: extends]:::cls
  N14519 --> N14520
  N14521[Class: extends]:::cls
  N14519 --> N14521
  N14534[File: persistentState.ts]:::file
  N11970 --> N14534
  N14535[Class: PersistentState]:::cls
  N14534 --> N14535
  N14536[getPath()]:::mth
  N14535 --> N14536
  N14537[load()]:::mth
  N14535 --> N14537
  N14538[save()]:::mth
  N14535 --> N14538
  N14548[File: sandbox.test.ts]:::file
  N11970 --> N14548
  N14549[Class: extends]:::cls
  N14548 --> N14549
  N14557[File: sessionUtils.ts]:::file
  N11970 --> N14557
  N14558[Class: SessionError]:::cls
  N14557 --> N14558
  N14559[noSessionsFound()]:::mth
  N14558 --> N14559
  N14560[invalidSessionIdentifier()]:::mth
  N14558 --> N14560
  N14561[async()]:::mth
  N14558 --> N14561
  N14562[async()]:::mth
  N14558 --> N14562
  N14563[stripUnsafeCharacters()]:::mth
  N14558 --> N14563
  N14564[Class: for]:::cls
  N14557 --> N14564
  N14565[noSessionsFound()]:::mth
  N14564 --> N14565
  N14566[invalidSessionIdentifier()]:::mth
  N14564 --> N14566
  N14567[async()]:::mth
  N14564 --> N14567
  N14568[async()]:::mth
  N14564 --> N14568
  N14569[stripUnsafeCharacters()]:::mth
  N14564 --> N14569
  N14570[Class: SessionSelector]:::cls
  N14557 --> N14570
  N14571[noSessionsFound()]:::mth
  N14570 --> N14571
  N14572[invalidSessionIdentifier()]:::mth
  N14570 --> N14572
  N14573[async()]:::mth
  N14570 --> N14573
  N14574[async()]:::mth
  N14570 --> N14574
  N14575[stripUnsafeCharacters()]:::mth
  N14570 --> N14575
  N14596[File: fileSystemService.ts]:::file
  N11970 --> N14596
  N14597[Class: AcpFileSystemService]:::cls
  N14596 --> N14597
  N14598[readTextFile()]:::mth
  N14597 --> N14598
  N14599[writeTextFile()]:::mth
  N14597 --> N14599
  N14601[File: zedIntegration.ts]:::file
  N11970 --> N14601
  N14602[Class: GeminiAgent]:::cls
  N14601 --> N14602
  N14603[runZedIntegration()]:::mth
  N14602 --> N14603
  N14604[initialize()]:::mth
  N14602 --> N14604
  N14605[authenticate()]:::mth
  N14602 --> N14605
  N14606[newSession()]:::mth
  N14602 --> N14606
  N14607[newSessionConfig()]:::mth
  N14602 --> N14607
  N14608[Class: Session]:::cls
  N14601 --> N14608
  N14609[runZedIntegration()]:::mth
  N14608 --> N14609
  N14610[initialize()]:::mth
  N14608 --> N14610
  N14611[authenticate()]:::mth
  N14608 --> N14611
  N14612[newSession()]:::mth
  N14608 --> N14612
  N14613[newSessionConfig()]:::mth
  N14608 --> N14613
  N14619[File: a2a-client-manager.ts]:::file
  N11970 --> N14619
  N14620[Class: A2AClientManager]:::cls
  N14619 --> N14620
  N14621[getInstance()]:::mth
  N14620 --> N14621
  N14622[resetInstanceForTesting()]:::mth
  N14620 --> N14622
  N14623[loadAgent()]:::mth
  N14620 --> N14623
  N14624[clearCache()]:::mth
  N14620 --> N14624
  N14625[sendMessage()]:::mth
  N14620 --> N14625
  N14629[File: agentLoader.ts]:::file
  N11970 --> N14629
  N14630[Class: AgentLoadError]:::cls
  N14629 --> N14630
  N14631[formatZodError()]:::mth
  N14630 --> N14631
  N14632[parseAgentMarkdown()]:::mth
  N14630 --> N14632
  N14633[markdownToAgentDefinition()]:::mth
  N14630 --> N14633
  N14634[loadAgentsFromDirectory()]:::mth
  N14630 --> N14634
  N14640[File: delegate-to-agent-tool.ts]:::file
  N11970 --> N14640
  N14641[Class: DelegateToAgentTool]:::cls
  N14640 --> N14641
  N14642[validateToolParams()]:::mth
  N14641 --> N14642
  N14643[createInvocation()]:::mth
  N14641 --> N14643
  N14644[getDescription()]:::mth
  N14641 --> N14644
  N14645[shouldConfirmExecute()]:::mth
  N14641 --> N14645
  N14646[buildSubInvocation()]:::mth
  N14641 --> N14646
  N14647[Class: DelegateInvocation]:::cls
  N14640 --> N14647
  N14648[validateToolParams()]:::mth
  N14647 --> N14648
  N14649[createInvocation()]:::mth
  N14647 --> N14649
  N14650[getDescription()]:::mth
  N14647 --> N14650
  N14651[shouldConfirmExecute()]:::mth
  N14647 --> N14651
  N14652[buildSubInvocation()]:::mth
  N14647 --> N14652
  N14656[File: local-executor.ts]:::file
  N11970 --> N14656
  N14657[Class: LocalAgentExecutor]:::cls
  N14656 --> N14657
  N14658[createUnauthorizedToolError()]:::mth
  N14657 --> N14658
  N14659[executeTurn()]:::mth
  N14657 --> N14659
  N14660[getFinalWarningMessage()]:::mth
  N14657 --> N14660
  N14661[run()]:::mth
  N14657 --> N14661
  N14662[templateString()]:::mth
  N14657 --> N14662
  N14664[File: local-invocation.ts]:::file
  N11970 --> N14664
  N14665[Class: orchestrates]:::cls
  N14664 --> N14665
  N14666[getDescription()]:::mth
  N14665 --> N14666
  N14667[Class: LocalSubagentInvocation]:::cls
  N14664 --> N14667
  N14668[getDescription()]:::mth
  N14667 --> N14668
  N14669[File: registry.test.ts]:::file
  N11970 --> N14669
  N14670[Class: to]:::cls
  N14669 --> N14670
  N14671[makeMockedConfig()]:::mth
  N14670 --> N14671
  N14672[testRegisterAgent()]:::mth
  N14670 --> N14672
  N14673[toolConfig()]:::mth
  N14670 --> N14673
  N14674[Class: TestableAgentRegistry]:::cls
  N14669 --> N14674
  N14675[makeMockedConfig()]:::mth
  N14674 --> N14675
  N14676[testRegisterAgent()]:::mth
  N14674 --> N14676
  N14677[toolConfig()]:::mth
  N14674 --> N14677
  N14678[File: registry.ts]:::file
  N11970 --> N14678
  N14679[Class: AgentRegistry]:::cls
  N14678 --> N14679
  N14680[initialize()]:::mth
  N14679 --> N14680
  N14681[reload()]:::mth
  N14679 --> N14681
  N14682[dispose()]:::mth
  N14679 --> N14682
  N14683[loadAgents()]:::mth
  N14679 --> N14683
  N14684[loadBuiltInAgents()]:::mth
  N14679 --> N14684
  N14686[File: remote-invocation.ts]:::file
  N11970 --> N14686
  N14687[Class: ADCHandler]:::cls
  N14686 --> N14687
  N14688[headers()]:::mth
  N14687 --> N14688
  N14689[shouldRetryWithHeaders()]:::mth
  N14687 --> N14689
  N14690[getDescription()]:::mth
  N14687 --> N14690
  N14691[getConfirmationDetails()]:::mth
  N14687 --> N14691
  N14692[execute()]:::mth
  N14687 --> N14692
  N14693[Class: RemoteAgentInvocation]:::cls
  N14686 --> N14693
  N14694[headers()]:::mth
  N14693 --> N14694
  N14695[shouldRetryWithHeaders()]:::mth
  N14693 --> N14695
  N14696[getDescription()]:::mth
  N14693 --> N14696
  N14697[getConfirmationDetails()]:::mth
  N14693 --> N14697
  N14698[execute()]:::mth
  N14693 --> N14698
  N14701[File: subagent-tool-wrapper.test.ts]:::file
  N11970 --> N14701
  N14702[Class: vi]:::cls
  N14701 --> N14702
  N14703[Class: performs]:::cls
  N14701 --> N14703
  N14704[File: subagent-tool-wrapper.ts]:::file
  N11970 --> N14704
  N14705[Class: SubagentToolWrapper]:::cls
  N14704 --> N14705
  N14706[createInvocation()]:::mth
  N14705 --> N14706
  N14713[File: modelAvailabilityService.ts]:::file
  N11970 --> N14713
  N14714[Class: ModelAvailabilityService]:::cls
  N14713 --> N14714
  N14715[markTerminal()]:::mth
  N14714 --> N14715
  N14716[markHealthy()]:::mth
  N14714 --> N14716
  N14717[markRetryOncePerTurn()]:::mth
  N14714 --> N14717
  N14718[consumeStickyAttempt()]:::mth
  N14714 --> N14718
  N14719[snapshot()]:::mth
  N14714 --> N14719
  N14740[File: oauth-credential-storage.ts]:::file
  N11970 --> N14740
  N14741[Class: OAuthCredentialStorage]:::cls
  N14740 --> N14741
  N14742[loadCredentials()]:::mth
  N14741 --> N14742
  N14743[saveCredentials()]:::mth
  N14741 --> N14743
  N14744[clearCredentials()]:::mth
  N14741 --> N14744
  N14745[migrateFromFileStorage()]:::mth
  N14741 --> N14745
  N14749[File: server.ts]:::file
  N11970 --> N14749
  N14750[Class: CodeAssistServer]:::cls
  N14749 --> N14750
  N14751[generateContentStream()]:::mth
  N14750 --> N14751
  N14752[await()]:::mth
  N14750 --> N14752
  N14753[generateContent()]:::mth
  N14750 --> N14753
  N14754[onboardUser()]:::mth
  N14750 --> N14754
  N14755[getOperation()]:::mth
  N14750 --> N14755
  N14757[File: setup.ts]:::file
  N11970 --> N14757
  N14758[Class: ProjectIdRequiredError]:::cls
  N14757 --> N14758
  N14759[setupUser()]:::mth
  N14758 --> N14759
  N14760[getOnboardTier()]:::mth
  N14758 --> N14760
  N14773[File: config.test.ts]:::file
  N11970 --> N14773
  N14774[Class: MockRipGrepTool]:::cls
  N14773 --> N14774
  N14775[Class: is]:::cls
  N14773 --> N14775
  N14776[Class: names]:::cls
  N14773 --> N14776
  N14777[Class: name]:::cls
  N14773 --> N14777
  N14778[Class: name]:::cls
  N14773 --> N14778
  N14779[File: config.ts]:::file
  N11970 --> N14779
  N14780[Class: MCPServerConfig]:::cls
  N14779 --> N14780
  N14781[TODO()]:::mth
  N14780 --> N14781
  N14782[TODO()]:::mth
  N14780 --> N14782
  N14783[initialize()]:::mth
  N14780 --> N14783
  N14784[getContentGenerator()]:::mth
  N14780 --> N14784
  N14785[refreshAuth()]:::mth
  N14780 --> N14785
  N14786[Class: Config]:::cls
  N14779 --> N14786
  N14787[TODO()]:::mth
  N14786 --> N14787
  N14788[TODO()]:::mth
  N14786 --> N14788
  N14789[initialize()]:::mth
  N14786 --> N14789
  N14790[getContentGenerator()]:::mth
  N14786 --> N14790
  N14791[refreshAuth()]:::mth
  N14786 --> N14791
  N14798[File: storage.ts]:::file
  N11970 --> N14798
  N14799[Class: Storage]:::cls
  N14798 --> N14799
  N14800[getGlobalGeminiDir()]:::mth
  N14799 --> N14800
  N14801[getMcpOAuthTokensPath()]:::mth
  N14799 --> N14801
  N14802[getGlobalSettingsPath()]:::mth
  N14799 --> N14802
  N14803[getInstallationIdPath()]:::mth
  N14799 --> N14803
  N14804[getGoogleAccountsPath()]:::mth
  N14799 --> N14804
  N14807[File: message-bus.ts]:::file
  N11970 --> N14807
  N14808[Class: MessageBus]:::cls
  N14807 --> N14808
  N14809[isValidMessage()]:::mth
  N14808 --> N14809
  N14810[emitMessage()]:::mth
  N14808 --> N14810
  N14811[publish()]:::mth
  N14808 --> N14811
  N14816[File: baseLlmClient.ts]:::file
  N11970 --> N14816
  N14817[Class: BaseLlmClient]:::cls
  N14816 --> N14817
  N14818[generateJson()]:::mth
  N14817 --> N14818
  N14819[generateEmbedding()]:::mth
  N14817 --> N14819
  N14820[cleanJsonResponse()]:::mth
  N14817 --> N14820
  N14821[generateContent()]:::mth
  N14817 --> N14821
  N14822[handleFallback()]:::mth
  N14817 --> N14822
  N14823[File: client.test.ts]:::file
  N11970 --> N14823
  N14824[Class: that]:::cls
  N14823 --> N14824
  N14825[await()]:::mth
  N14824 --> N14825
  N14826[getResolvedConfig()]:::mth
  N14824 --> N14826
  N14827[setup()]:::mth
  N14824 --> N14827
  N14828[1()]:::mth
  N14824 --> N14828
  N14829[2()]:::mth
  N14824 --> N14829
  N14830[Class: MockTurn]:::cls
  N14823 --> N14830
  N14831[await()]:::mth
  N14830 --> N14831
  N14832[getResolvedConfig()]:::mth
  N14830 --> N14832
  N14833[setup()]:::mth
  N14830 --> N14833
  N14834[1()]:::mth
  N14830 --> N14834
  N14835[2()]:::mth
  N14830 --> N14835
  N14836[Class: as]:::cls
  N14823 --> N14836
  N14837[await()]:::mth
  N14836 --> N14837
  N14838[getResolvedConfig()]:::mth
  N14836 --> N14838
  N14839[setup()]:::mth
  N14836 --> N14839
  N14840[1()]:::mth
  N14836 --> N14840
  N14841[2()]:::mth
  N14836 --> N14841
  N14842[Class: in]:::cls
  N14823 --> N14842
  N14843[await()]:::mth
  N14842 --> N14843
  N14844[getResolvedConfig()]:::mth
  N14842 --> N14844
  N14845[setup()]:::mth
  N14842 --> N14845
  N14846[1()]:::mth
  N14842 --> N14846
  N14847[2()]:::mth
  N14842 --> N14847
  N14848[File: client.ts]:::file
  N11970 --> N14848
  N14849[Class: GeminiClient]:::cls
  N14848 --> N14849
  N14850[fireBeforeAgentHookSafe()]:::mth
  N14849 --> N14850
  N14851[fireAfterAgentHookSafe()]:::mth
  N14849 --> N14851
  N14852[updateTelemetryTokenCount()]:::mth
  N14849 --> N14852
  N14853[initialize()]:::mth
  N14849 --> N14853
  N14854[getContentGeneratorOrFail()]:::mth
  N14849 --> N14854
  N14858[File: coreToolHookTriggers.test.ts]:::file
  N11970 --> N14858
  N14859[Class: MockInvocation]:::cls
  N14858 --> N14859
  N14860[getDescription()]:::mth
  N14859 --> N14860
  N14861[execute()]:::mth
  N14859 --> N14861
  N14863[File: coreToolScheduler.test.ts]:::file
  N11970 --> N14863
  N14864[Class: TestApprovalTool]:::cls
  N14863 --> N14864
  N14865[createInvocation()]:::mth
  N14864 --> N14865
  N14866[getDescription()]:::mth
  N14864 --> N14866
  N14867[shouldConfirmExecute()]:::mth
  N14864 --> N14867
  N14868[execute()]:::mth
  N14864 --> N14868
  N14869[shouldConfirmExecute()]:::mth
  N14864 --> N14869
  N14870[Class: TestApprovalInvocation]:::cls
  N14863 --> N14870
  N14871[createInvocation()]:::mth
  N14870 --> N14871
  N14872[getDescription()]:::mth
  N14870 --> N14872
  N14873[shouldConfirmExecute()]:::mth
  N14870 --> N14873
  N14874[execute()]:::mth
  N14870 --> N14874
  N14875[shouldConfirmExecute()]:::mth
  N14870 --> N14875
  N14876[Class: AbortDuringConfirmationInvocation]:::cls
  N14863 --> N14876
  N14877[createInvocation()]:::mth
  N14876 --> N14877
  N14878[getDescription()]:::mth
  N14876 --> N14878
  N14879[shouldConfirmExecute()]:::mth
  N14876 --> N14879
  N14880[execute()]:::mth
  N14876 --> N14880
  N14881[shouldConfirmExecute()]:::mth
  N14876 --> N14881
  N14882[Class: AbortDuringConfirmationTool]:::cls
  N14863 --> N14882
  N14883[createInvocation()]:::mth
  N14882 --> N14883
  N14884[getDescription()]:::mth
  N14882 --> N14884
  N14885[shouldConfirmExecute()]:::mth
  N14882 --> N14885
  N14886[execute()]:::mth
  N14882 --> N14886
  N14887[shouldConfirmExecute()]:::mth
  N14882 --> N14887
  N14888[Class: MockEditToolInvocation]:::cls
  N14863 --> N14888
  N14889[createInvocation()]:::mth
  N14888 --> N14889
  N14890[getDescription()]:::mth
  N14888 --> N14890
  N14891[shouldConfirmExecute()]:::mth
  N14888 --> N14891
  N14892[execute()]:::mth
  N14888 --> N14892
  N14893[shouldConfirmExecute()]:::mth
  N14888 --> N14893
  N14894[Class: MockEditTool]:::cls
  N14863 --> N14894
  N14895[createInvocation()]:::mth
  N14894 --> N14895
  N14896[getDescription()]:::mth
  N14894 --> N14896
  N14897[shouldConfirmExecute()]:::mth
  N14894 --> N14897
  N14898[execute()]:::mth
  N14894 --> N14898
  N14899[shouldConfirmExecute()]:::mth
  N14894 --> N14899
  N14900[File: coreToolScheduler.ts]:::file
  N11970 --> N14900
  N14901[Class: CoreToolScheduler]:::cls
  N14900 --> N14901
  N14902[setStatusInternal()]:::mth
  N14901 --> N14902
  N14903[setArgsInternal()]:::mth
  N14901 --> N14903
  N14904[isRunning()]:::mth
  N14901 --> N14904
  N14905[buildInvocation()]:::mth
  N14901 --> N14905
  N14906[schedule()]:::mth
  N14901 --> N14906
  N14908[File: fakeContentGenerator.ts]:::file
  N11970 --> N14908
  N14909[Class: FakeContentGenerator]:::cls
  N14908 --> N14909
  N14910[fromFile()]:::mth
  N14909 --> N14910
  N14911[generateContent()]:::mth
  N14909 --> N14911
  N14912[generateContentStream()]:::mth
  N14909 --> N14912
  N14913[stream()]:::mth
  N14909 --> N14913
  N14914[countTokens()]:::mth
  N14909 --> N14914
  N14916[File: geminiChat.ts]:::file
  N11970 --> N14916
  N14917[Class: InvalidStreamError]:::cls
  N14916 --> N14917
  N14918[isValidResponse()]:::mth
  N14917 --> N14918
  N14919[isValidNonThoughtTextPart()]:::mth
  N14917 --> N14919
  N14920[isValidContent()]:::mth
  N14917 --> N14920
  N14921[validateHistory()]:::mth
  N14917 --> N14921
  N14922[extractCuratedHistory()]:::mth
  N14917 --> N14922
  N14923[Class: AgentExecutionStoppedError]:::cls
  N14916 --> N14923
  N14924[isValidResponse()]:::mth
  N14923 --> N14924
  N14925[isValidNonThoughtTextPart()]:::mth
  N14923 --> N14925
  N14926[isValidContent()]:::mth
  N14923 --> N14926
  N14927[validateHistory()]:::mth
  N14923 --> N14927
  N14928[extractCuratedHistory()]:::mth
  N14923 --> N14928
  N14929[Class: AgentExecutionBlockedError]:::cls
  N14916 --> N14929
  N14930[isValidResponse()]:::mth
  N14929 --> N14930
  N14931[isValidNonThoughtTextPart()]:::mth
  N14929 --> N14931
  N14932[isValidContent()]:::mth
  N14929 --> N14932
  N14933[validateHistory()]:::mth
  N14929 --> N14933
  N14934[extractCuratedHistory()]:::mth
  N14929 --> N14934
  N14935[Class: GeminiChat]:::cls
  N14916 --> N14935
  N14936[isValidResponse()]:::mth
  N14935 --> N14936
  N14937[isValidNonThoughtTextPart()]:::mth
  N14935 --> N14937
  N14938[isValidContent()]:::mth
  N14935 --> N14938
  N14939[validateHistory()]:::mth
  N14935 --> N14939
  N14940[extractCuratedHistory()]:::mth
  N14935 --> N14940
  N14946[File: logger.ts]:::file
  N11970 --> N14946
  N14947[Class: Logger]:::cls
  N14946 --> N14947
  N14948[encodeTagName()]:::mth
  N14947 --> N14948
  N14949[decodeTagName()]:::mth
  N14947 --> N14949
  N14950[_readLogFile()]:::mth
  N14947 --> N14950
  N14951[_backupCorruptedLogFile()]:::mth
  N14947 --> N14951
  N14952[initialize()]:::mth
  N14947 --> N14952
  N14954[File: loggingContentGenerator.ts]:::file
  N11970 --> N14954
  N14955[Class: LoggingContentGenerator]:::cls
  N14954 --> N14955
  N14956[getWrapped()]:::mth
  N14955 --> N14956
  N14957[logApiRequest()]:::mth
  N14955 --> N14957
  N14958[_getEndpointUrl()]:::mth
  N14955 --> N14958
  N14959[parseInt()]:::mth
  N14955 --> N14959
  N14960[_logApiResponse()]:::mth
  N14955 --> N14960
  N14966[File: recordingContentGenerator.ts]:::file
  N11970 --> N14966
  N14967[Class: RecordingContentGenerator]:::cls
  N14966 --> N14967
  N14968[generateContent()]:::mth
  N14967 --> N14968
  N14969[generateContentStream()]:::mth
  N14967 --> N14969
  N14970[stream()]:::mth
  N14967 --> N14970
  N14971[await()]:::mth
  N14967 --> N14971
  N14972[countTokens()]:::mth
  N14967 --> N14972
  N14976[File: turn.ts]:::file
  N11970 --> N14976
  N14977[Class: Turn]:::cls
  N14976 --> N14977
  N14978[execute()]:::mth
  N14977 --> N14978
  N14979[await()]:::mth
  N14977 --> N14979
  N14980[handlePendingFunctionCall()]:::mth
  N14977 --> N14980
  N14981[getDebugResponses()]:::mth
  N14977 --> N14981
  N14982[getResponseText()]:::mth
  N14977 --> N14982
  N14983[File: handler.test.ts]:::file
  N11970 --> N14983
  N14984[Class: vi]:::cls
  N14983 --> N14984
  N14989[File: hookAggregator.ts]:::file
  N11970 --> N14989
  N14990[Class: HookAggregator]:::cls
  N14989 --> N14990
  N14991[aggregateResults()]:::mth
  N14990 --> N14991
  N14992[mergeOutputs()]:::mth
  N14990 --> N14992
  N14993[mergeWithOrDecision()]:::mth
  N14990 --> N14993
  N14994[mergeWithFieldReplacement()]:::mth
  N14990 --> N14994
  N14995[mergeToolSelectionOutputs()]:::mth
  N14990 --> N14995
  N14996[Class: based]:::cls
  N14989 --> N14996
  N14997[aggregateResults()]:::mth
  N14996 --> N14997
  N14998[mergeOutputs()]:::mth
  N14996 --> N14998
  N14999[mergeWithOrDecision()]:::mth
  N14996 --> N14999
  N15000[mergeWithFieldReplacement()]:::mth
  N14996 --> N15000
  N15001[mergeToolSelectionOutputs()]:::mth
  N14996 --> N15001
  N15003[File: hookEventHandler.ts]:::file
  N11970 --> N15003
  N15004[Class: HookEventHandler]:::cls
  N15003 --> N15004
  N15005[isObject()]:::mth
  N15004 --> N15005
  N15006[validateBeforeToolInput()]:::mth
  N15004 --> N15006
  N15007[validateAfterToolInput()]:::mth
  N15004 --> N15007
  N15008[validateBeforeAgentInput()]:::mth
  N15004 --> N15008
  N15009[validateAfterAgentInput()]:::mth
  N15004 --> N15009
  N15011[File: hookPlanner.ts]:::file
  N11970 --> N15011
  N15012[Class: HookPlanner]:::cls
  N15011 --> N15012
  N15013[createExecutionPlan()]:::mth
  N15012 --> N15013
  N15014[matchesContext()]:::mth
  N15012 --> N15014
  N15015[matchesToolName()]:::mth
  N15012 --> N15015
  N15016[matchesTrigger()]:::mth
  N15012 --> N15016
  N15017[deduplicateHooks()]:::mth
  N15012 --> N15017
  N15019[File: hookRegistry.ts]:::file
  N11970 --> N15019
  N15020[Class: HookRegistry]:::cls
  N15019 --> N15020
  N15021[initialize()]:::mth
  N15020 --> N15021
  N15022[getHooksForEvent()]:::mth
  N15020 --> N15022
  N15023[getAllHooks()]:::mth
  N15020 --> N15023
  N15024[setHookEnabled()]:::mth
  N15020 --> N15024
  N15025[getHookName()]:::mth
  N15020 --> N15025
  N15027[File: hookRunner.ts]:::file
  N11970 --> N15027
  N15028[Class: HookRunner]:::cls
  N15027 --> N15028
  N15029[executeHook()]:::mth
  N15028 --> N15029
  N15030[error()]:::mth
  N15028 --> N15030
  N15031[applyHookOutputToInput()]:::mth
  N15028 --> N15031
  N15032[executeCommandHook()]:::mth
  N15028 --> N15032
  N15033[error()]:::mth
  N15028 --> N15033
  N15035[File: hookSystem.ts]:::file
  N11970 --> N15035
  N15036[Class: HookSystem]:::cls
  N15035 --> N15036
  N15037[initialize()]:::mth
  N15036 --> N15037
  N15038[getEventHandler()]:::mth
  N15036 --> N15038
  N15039[getRegistry()]:::mth
  N15036 --> N15039
  N15040[setHookEnabled()]:::mth
  N15036 --> N15040
  N15041[getAllHooks()]:::mth
  N15036 --> N15041
  N15043[File: hookTranslator.ts]:::file
  N11970 --> N15043
  N15044[Class: for]:::cls
  N15043 --> N15044
  N15045[toHookLLMRequest()]:::mth
  N15044 --> N15045
  N15046[isContentWithParts()]:::mth
  N15044 --> N15046
  N15047[extractGenerationConfig()]:::mth
  N15044 --> N15047
  N15048[toHookLLMRequest()]:::mth
  N15044 --> N15048
  N15049[fromHookLLMRequest()]:::mth
  N15044 --> N15049
  N15050[Class: HookTranslator]:::cls
  N15043 --> N15050
  N15051[toHookLLMRequest()]:::mth
  N15050 --> N15051
  N15052[isContentWithParts()]:::mth
  N15050 --> N15052
  N15053[extractGenerationConfig()]:::mth
  N15050 --> N15053
  N15054[toHookLLMRequest()]:::mth
  N15050 --> N15054
  N15055[fromHookLLMRequest()]:::mth
  N15050 --> N15055
  N15056[Class: HookTranslatorGenAIv1]:::cls
  N15043 --> N15056
  N15057[toHookLLMRequest()]:::mth
  N15056 --> N15057
  N15058[isContentWithParts()]:::mth
  N15056 --> N15058
  N15059[extractGenerationConfig()]:::mth
  N15056 --> N15059
  N15060[toHookLLMRequest()]:::mth
  N15056 --> N15060
  N15061[fromHookLLMRequest()]:::mth
  N15056 --> N15061
  N15064[File: trustedHooks.ts]:::file
  N11970 --> N15064
  N15065[Class: TrustedHooksManager]:::cls
  N15064 --> N15065
  N15066[load()]:::mth
  N15065 --> N15066
  N15067[save()]:::mth
  N15065 --> N15067
  N15068[getUntrustedHooks()]:::mth
  N15065 --> N15068
  N15069[trustHooks()]:::mth
  N15065 --> N15069
  N15071[File: types.ts]:::file
  N11970 --> N15071
  N15072[Class: based]:::cls
  N15071 --> N15072
  N15073[getHookKey()]:::mth
  N15072 --> N15073
  N15074[createHookOutput()]:::mth
  N15072 --> N15074
  N15075[isBlockingDecision()]:::mth
  N15072 --> N15075
  N15076[shouldStopExecution()]:::mth
  N15072 --> N15076
  N15077[getEffectiveReason()]:::mth
  N15072 --> N15077
  N15078[Class: DefaultHookOutput]:::cls
  N15071 --> N15078
  N15079[getHookKey()]:::mth
  N15078 --> N15079
  N15080[createHookOutput()]:::mth
  N15078 --> N15080
  N15081[isBlockingDecision()]:::mth
  N15078 --> N15081
  N15082[shouldStopExecution()]:::mth
  N15078 --> N15082
  N15083[getEffectiveReason()]:::mth
  N15078 --> N15083
  N15084[Class: for]:::cls
  N15071 --> N15084
  N15085[getHookKey()]:::mth
  N15084 --> N15085
  N15086[createHookOutput()]:::mth
  N15084 --> N15086
  N15087[isBlockingDecision()]:::mth
  N15084 --> N15087
  N15088[shouldStopExecution()]:::mth
  N15084 --> N15088
  N15089[getEffectiveReason()]:::mth
  N15084 --> N15089
  N15090[Class: BeforeToolHookOutput]:::cls
  N15071 --> N15090
  N15091[getHookKey()]:::mth
  N15090 --> N15091
  N15092[createHookOutput()]:::mth
  N15090 --> N15092
  N15093[isBlockingDecision()]:::mth
  N15090 --> N15093
  N15094[shouldStopExecution()]:::mth
  N15090 --> N15094
  N15095[getEffectiveReason()]:::mth
  N15090 --> N15095
  N15096[Class: for]:::cls
  N15071 --> N15096
  N15097[getHookKey()]:::mth
  N15096 --> N15097
  N15098[createHookOutput()]:::mth
  N15096 --> N15098
  N15099[isBlockingDecision()]:::mth
  N15096 --> N15099
  N15100[shouldStopExecution()]:::mth
  N15096 --> N15100
  N15101[getEffectiveReason()]:::mth
  N15096 --> N15101
  N15102[Class: BeforeModelHookOutput]:::cls
  N15071 --> N15102
  N15103[getHookKey()]:::mth
  N15102 --> N15103
  N15104[createHookOutput()]:::mth
  N15102 --> N15104
  N15105[isBlockingDecision()]:::mth
  N15102 --> N15105
  N15106[shouldStopExecution()]:::mth
  N15102 --> N15106
  N15107[getEffectiveReason()]:::mth
  N15102 --> N15107
  N15108[Class: for]:::cls
  N15071 --> N15108
  N15109[getHookKey()]:::mth
  N15108 --> N15109
  N15110[createHookOutput()]:::mth
  N15108 --> N15110
  N15111[isBlockingDecision()]:::mth
  N15108 --> N15111
  N15112[shouldStopExecution()]:::mth
  N15108 --> N15112
  N15113[getEffectiveReason()]:::mth
  N15108 --> N15113
  N15114[Class: BeforeToolSelectionHookOutput]:::cls
  N15071 --> N15114
  N15115[getHookKey()]:::mth
  N15114 --> N15115
  N15116[createHookOutput()]:::mth
  N15114 --> N15116
  N15117[isBlockingDecision()]:::mth
  N15114 --> N15117
  N15118[shouldStopExecution()]:::mth
  N15114 --> N15118
  N15119[getEffectiveReason()]:::mth
  N15114 --> N15119
  N15120[Class: for]:::cls
  N15071 --> N15120
  N15121[getHookKey()]:::mth
  N15120 --> N15121
  N15122[createHookOutput()]:::mth
  N15120 --> N15122
  N15123[isBlockingDecision()]:::mth
  N15120 --> N15123
  N15124[shouldStopExecution()]:::mth
  N15120 --> N15124
  N15125[getEffectiveReason()]:::mth
  N15120 --> N15125
  N15126[Class: AfterModelHookOutput]:::cls
  N15071 --> N15126
  N15127[getHookKey()]:::mth
  N15126 --> N15127
  N15128[createHookOutput()]:::mth
  N15126 --> N15128
  N15129[isBlockingDecision()]:::mth
  N15126 --> N15129
  N15130[shouldStopExecution()]:::mth
  N15126 --> N15130
  N15131[getEffectiveReason()]:::mth
  N15126 --> N15131
  N15136[File: ide-client.ts]:::file
  N11970 --> N15136
  N15137[Class: IdeClient]:::cls
  N15136 --> N15137
  N15138[getRealPath()]:::mth
  N15137 --> N15138
  N15139[getInstance()]:::mth
  N15137 --> N15139
  N15140[connect()]:::mth
  N15137 --> N15140
  N15141[openDiff()]:::mth
  N15137 --> N15141
  N15142[acquireMutex()]:::mth
  N15137 --> N15142
  N15144[File: ide-installer.ts]:::file
  N11970 --> N15144
  N15145[Class: VsCodeInstaller]:::cls
  N15144 --> N15145
  N15146[install()]:::mth
  N15145 --> N15146
  N15147[findCommand()]:::mth
  N15145 --> N15147
  N15148[install()]:::mth
  N15145 --> N15148
  N15149[install()]:::mth
  N15145 --> N15149
  N15150[getIdeInstaller()]:::mth
  N15145 --> N15150
  N15151[Class: AntigravityInstaller]:::cls
  N15144 --> N15151
  N15152[install()]:::mth
  N15151 --> N15152
  N15153[findCommand()]:::mth
  N15151 --> N15153
  N15154[install()]:::mth
  N15151 --> N15154
  N15155[install()]:::mth
  N15151 --> N15155
  N15156[getIdeInstaller()]:::mth
  N15151 --> N15156
  N15158[File: ideContext.ts]:::file
  N11970 --> N15158
  N15159[Class: IdeContextStore]:::cls
  N15158 --> N15159
  N15160[notifySubscribers()]:::mth
  N15159 --> N15160
  N15161[set()]:::mth
  N15159 --> N15161
  N15162[clear()]:::mth
  N15159 --> N15162
  N15163[get()]:::mth
  N15159 --> N15163
  N15164[subscribe()]:::mth
  N15159 --> N15164
  N15172[File: google-auth-provider.ts]:::file
  N11970 --> N15172
  N15173[Class: GoogleCredentialProvider]:::cls
  N15172 --> N15173
  N15174[clientInformation()]:::mth
  N15173 --> N15174
  N15175[saveClientInformation()]:::mth
  N15173 --> N15175
  N15176[tokens()]:::mth
  N15173 --> N15176
  N15177[saveTokens()]:::mth
  N15173 --> N15177
  N15178[redirectToAuthorization()]:::mth
  N15173 --> N15178
  N15180[File: oauth-provider.ts]:::file
  N11970 --> N15180
  N15181[Class: MCPOAuthProvider]:::cls
  N15180 --> N15181
  N15182[registerClient()]:::mth
  N15181 --> N15182
  N15183[discoverOAuthFromMCPServer()]:::mth
  N15181 --> N15183
  N15184[discoverAuthServerMetadataForRegistration()]:::mth
  N15181 --> N15184
  N15185[generatePKCEParams()]:::mth
  N15181 --> N15185
  N15186[startCallbackServer()]:::mth
  N15181 --> N15186
  N15188[File: oauth-token-storage.ts]:::file
  N11970 --> N15188
  N15189[Class: MCPOAuthTokenStorage]:::cls
  N15188 --> N15189
  N15190[getTokenFilePath()]:::mth
  N15189 --> N15190
  N15191[ensureConfigDir()]:::mth
  N15189 --> N15191
  N15192[getAllCredentials()]:::mth
  N15189 --> N15192
  N15193[listServers()]:::mth
  N15189 --> N15193
  N15194[setCredentials()]:::mth
  N15189 --> N15194
  N15196[File: oauth-utils.ts]:::file
  N11970 --> N15196
  N15197[Class: ResourceMismatchError]:::cls
  N15196 --> N15197
  N15198[buildWellKnownUrls()]:::mth
  N15197 --> N15198
  N15199[fetchProtectedResourceMetadata()]:::mth
  N15197 --> N15199
  N15200[fetchAuthorizationServerMetadata()]:::mth
  N15197 --> N15200
  N15201[metadataToOAuthConfig()]:::mth
  N15197 --> N15201
  N15202[discoverAuthorizationServerMetadata()]:::mth
  N15197 --> N15202
  N15203[Class: for]:::cls
  N15196 --> N15203
  N15204[buildWellKnownUrls()]:::mth
  N15203 --> N15204
  N15205[fetchProtectedResourceMetadata()]:::mth
  N15203 --> N15205
  N15206[fetchAuthorizationServerMetadata()]:::mth
  N15203 --> N15206
  N15207[metadataToOAuthConfig()]:::mth
  N15203 --> N15207
  N15208[discoverAuthorizationServerMetadata()]:::mth
  N15203 --> N15208
  N15209[Class: OAuthUtils]:::cls
  N15196 --> N15209
  N15210[buildWellKnownUrls()]:::mth
  N15209 --> N15210
  N15211[fetchProtectedResourceMetadata()]:::mth
  N15209 --> N15211
  N15212[fetchAuthorizationServerMetadata()]:::mth
  N15209 --> N15212
  N15213[metadataToOAuthConfig()]:::mth
  N15209 --> N15213
  N15214[discoverAuthorizationServerMetadata()]:::mth
  N15209 --> N15214
  N15216[File: sa-impersonation-provider.ts]:::file
  N11970 --> N15216
  N15217[Class: ServiceAccountImpersonationProvider]:::cls
  N15216 --> N15217
  N15218[createIamApiUrl()]:::mth
  N15217 --> N15218
  N15219[clientInformation()]:::mth
  N15217 --> N15219
  N15220[saveClientInformation()]:::mth
  N15217 --> N15220
  N15221[tokens()]:::mth
  N15217 --> N15221
  N15222[saveTokens()]:::mth
  N15217 --> N15222
  N15223[File: base-token-storage.test.ts]:::file
  N11970 --> N15223
  N15224[Class: TestTokenStorage]:::cls
  N15223 --> N15224
  N15225[getCredentials()]:::mth
  N15224 --> N15225
  N15226[setCredentials()]:::mth
  N15224 --> N15226
  N15227[deleteCredentials()]:::mth
  N15224 --> N15227
  N15228[listServers()]:::mth
  N15224 --> N15228
  N15229[getAllCredentials()]:::mth
  N15224 --> N15229
  N15230[File: base-token-storage.ts]:::file
  N11970 --> N15230
  N15231[Class: BaseTokenStorage]:::cls
  N15230 --> N15231
  N15232[getCredentials()]:::mth
  N15231 --> N15232
  N15233[isTokenExpired()]:::mth
  N15231 --> N15233
  N15234[sanitizeServerName()]:::mth
  N15231 --> N15234
  N15236[File: file-token-storage.ts]:::file
  N11970 --> N15236
  N15237[Class: FileTokenStorage]:::cls
  N15236 --> N15237
  N15238[deriveEncryptionKey()]:::mth
  N15237 --> N15238
  N15239[encrypt()]:::mth
  N15237 --> N15239
  N15240[decrypt()]:::mth
  N15237 --> N15240
  N15241[ensureDirectoryExists()]:::mth
  N15237 --> N15241
  N15242[loadTokens()]:::mth
  N15237 --> N15242
  N15244[File: hybrid-token-storage.ts]:::file
  N11970 --> N15244
  N15245[Class: HybridTokenStorage]:::cls
  N15244 --> N15245
  N15246[initializeStorage()]:::mth
  N15245 --> N15246
  N15247[getStorage()]:::mth
  N15245 --> N15247
  N15248[getCredentials()]:::mth
  N15245 --> N15248
  N15249[setCredentials()]:::mth
  N15245 --> N15249
  N15250[deleteCredentials()]:::mth
  N15245 --> N15250
  N15253[File: keychain-token-storage.ts]:::file
  N11970 --> N15253
  N15254[Class: KeychainTokenStorage]:::cls
  N15253 --> N15254
  N15255[getPassword()]:::mth
  N15254 --> N15255
  N15256[getKeytar()]:::mth
  N15254 --> N15256
  N15257[getCredentials()]:::mth
  N15254 --> N15257
  N15258[setCredentials()]:::mth
  N15254 --> N15258
  N15259[deleteCredentials()]:::mth
  N15254 --> N15259
  N15262[File: json-formatter.test.ts]:::file
  N11970 --> N15262
  N15263[Class: CustomError]:::cls
  N15262 --> N15263
  N15264[File: json-formatter.ts]:::file
  N11970 --> N15264
  N15265[Class: JsonFormatter]:::cls
  N15264 --> N15265
  N15266[format()]:::mth
  N15265 --> N15266
  N15267[formatError()]:::mth
  N15265 --> N15267
  N15269[File: stream-json-formatter.ts]:::file
  N11970 --> N15269
  N15270[Class: StreamJsonFormatter]:::cls
  N15269 --> N15270
  N15271[formatEvent()]:::mth
  N15270 --> N15271
  N15272[emitEvent()]:::mth
  N15270 --> N15272
  N15273[convertToStreamStats()]:::mth
  N15270 --> N15273
  N15280[File: policy-engine.ts]:::file
  N11970 --> N15280
  N15281[Class: PolicyEngine]:::cls
  N15280 --> N15281
  N15282[ruleMatches()]:::mth
  N15281 --> N15282
  N15283[hookCheckerMatches()]:::mth
  N15281 --> N15283
  N15284[setApprovalMode()]:::mth
  N15281 --> N15284
  N15285[getApprovalMode()]:::mth
  N15281 --> N15285
  N15286[shouldDowngradeForRedirection()]:::mth
  N15281 --> N15286
  N15298[File: prompt-registry.ts]:::file
  N11970 --> N15298
  N15299[Class: PromptRegistry]:::cls
  N15298 --> N15299
  N15300[registerPrompt()]:::mth
  N15299 --> N15300
  N15301[getAllPrompts()]:::mth
  N15299 --> N15301
  N15302[getPrompt()]:::mth
  N15299 --> N15302
  N15303[getPromptsByServer()]:::mth
  N15299 --> N15303
  N15304[clear()]:::mth
  N15299 --> N15304
  N15306[File: resource-registry.ts]:::file
  N11970 --> N15306
  N15307[Class: ResourceRegistry]:::cls
  N15306 --> N15307
  N15308[setResourcesForServer()]:::mth
  N15307 --> N15308
  N15309[getAllResources()]:::mth
  N15307 --> N15309
  N15310[findResourceByUri()]:::mth
  N15307 --> N15310
  N15311[removeResourcesByServer()]:::mth
  N15307 --> N15311
  N15312[clear()]:::mth
  N15307 --> N15312
  N15314[File: modelRouterService.ts]:::file
  N11970 --> N15314
  N15315[Class: ModelRouterService]:::cls
  N15314 --> N15315
  N15316[initializeDefaultStrategy()]:::mth
  N15315 --> N15316
  N15317[route()]:::mth
  N15315 --> N15317
  N15320[File: classifierStrategy.ts]:::file
  N11970 --> N15320
  N15321[Class: ClassifierStrategy]:::cls
  N15320 --> N15321
  N15322[Complexity()]:::mth
  N15321 --> N15322
  N15323[1()]:::mth
  N15321 --> N15323
  N15324[2()]:::mth
  N15321 --> N15324
  N15325[3()]:::mth
  N15321 --> N15325
  N15326[4()]:::mth
  N15321 --> N15326
  N15328[File: compositeStrategy.ts]:::file
  N11970 --> N15328
  N15329[Class: CompositeStrategy]:::cls
  N15328 --> N15329
  N15330[route()]:::mth
  N15329 --> N15330
  N15331[finalizeDecision()]:::mth
  N15329 --> N15331
  N15333[File: defaultStrategy.ts]:::file
  N11970 --> N15333
  N15334[Class: DefaultStrategy]:::cls
  N15333 --> N15334
  N15335[route()]:::mth
  N15334 --> N15335
  N15337[File: fallbackStrategy.ts]:::file
  N11970 --> N15337
  N15338[Class: FallbackStrategy]:::cls
  N15337 --> N15338
  N15339[route()]:::mth
  N15338 --> N15339
  N15341[File: overrideStrategy.ts]:::file
  N11970 --> N15341
  N15342[Class: OverrideStrategy]:::cls
  N15341 --> N15342
  N15343[route()]:::mth
  N15342 --> N15343
  N15345[File: built-in.ts]:::file
  N11970 --> N15345
  N15346[Class: AllowedPathChecker]:::cls
  N15345 --> N15346
  N15347[check()]:::mth
  N15346 --> N15347
  N15348[check()]:::mth
  N15346 --> N15348
  N15349[safelyResolvePath()]:::mth
  N15346 --> N15349
  N15350[isPathAllowed()]:::mth
  N15346 --> N15350
  N15351[collectPathsToCheck()]:::mth
  N15346 --> N15351
  N15353[File: checker-runner.ts]:::file
  N11970 --> N15353
  N15354[Class: CheckerRunner]:::cls
  N15353 --> N15354
  N15355[runChecker()]:::mth
  N15354 --> N15355
  N15356[runInProcessChecker()]:::mth
  N15354 --> N15356
  N15357[runExternalChecker()]:::mth
  N15354 --> N15357
  N15358[executeCheckerProcess()]:::mth
  N15354 --> N15358
  N15360[File: context-builder.ts]:::file
  N11970 --> N15360
  N15361[Class: ContextBuilder]:::cls
  N15360 --> N15361
  N15362[buildFullContext()]:::mth
  N15361 --> N15362
  N15363[buildMinimalContext()]:::mth
  N15361 --> N15363
  N15366[File: registry.ts]:::file
  N11970 --> N15366
  N15367[Class: CheckerRegistry]:::cls
  N15366 --> N15367
  N15368[resolveExternal()]:::mth
  N15367 --> N15368
  N15369[resolveInProcess()]:::mth
  N15367 --> N15369
  N15370[isValidCheckerName()]:::mth
  N15367 --> N15370
  N15371[getBuiltInCheckers()]:::mth
  N15367 --> N15371
  N15376[File: scheduler.test.ts]:::file
  N11970 --> N15376
  N15377[Class: constructors]:::cls
  N15376 --> N15377
  N15378[File: scheduler.ts]:::file
  N11970 --> N15378
  N15379[Class: Scheduler]:::cls
  N15378 --> N15379
  N15380[setupMessageBusListener()]:::mth
  N15379 --> N15380
  N15381[schedule()]:::mth
  N15379 --> N15381
  N15382[_enqueueRequest()]:::mth
  N15379 --> N15382
  N15383[cancelAll()]:::mth
  N15379 --> N15383
  N15384[completedCalls()]:::mth
  N15379 --> N15384
  N15386[File: state-manager.ts]:::file
  N11970 --> N15386
  N15387[Class: SchedulerStateManager]:::cls
  N15386 --> N15387
  N15388[addToolCalls()]:::mth
  N15387 --> N15388
  N15389[getToolCall()]:::mth
  N15387 --> N15389
  N15390[enqueue()]:::mth
  N15387 --> N15390
  N15391[dequeue()]:::mth
  N15387 --> N15391
  N15392[isActive()]:::mth
  N15387 --> N15392
  N15394[File: tool-executor.ts]:::file
  N11970 --> N15394
  N15395[Class: ToolExecutor]:::cls
  N15394 --> N15395
  N15396[execute()]:::mth
  N15395 --> N15396
  N15397[createCancelledResult()]:::mth
  N15395 --> N15397
  N15398[createSuccessResult()]:::mth
  N15395 --> N15398
  N15399[createErrorResult()]:::mth
  N15395 --> N15399
  N15400[createErrorResponse()]:::mth
  N15395 --> N15400
  N15402[File: tool-modifier.ts]:::file
  N11970 --> N15402
  N15403[Class: ToolModificationHandler]:::cls
  N15402 --> N15403
  N15404[handleModifyWithEditor()]:::mth
  N15403 --> N15404
  N15405[applyInlineModify()]:::mth
  N15403 --> N15405
  N15408[File: chatCompressionService.ts]:::file
  N11970 --> N15408
  N15409[Class: ChatCompressionService]:::cls
  N15408 --> N15409
  N15410[findCompressSplitPoint()]:::mth
  N15409 --> N15410
  N15411[modelStringToModelConfigAlias()]:::mth
  N15409 --> N15411
  N15412[truncateHistoryToBudget()]:::mth
  N15409 --> N15412
  N15413[compress()]:::mth
  N15409 --> N15413
  N15414[TODO()]:::mth
  N15409 --> N15414
  N15416[File: chatRecordingService.ts]:::file
  N11970 --> N15416
  N15417[Class: ChatRecordingService]:::cls
  N15416 --> N15417
  N15418[initialize()]:::mth
  N15417 --> N15418
  N15419[getLastMessage()]:::mth
  N15417 --> N15419
  N15420[newMessage()]:::mth
  N15417 --> N15420
  N15421[recordMessage()]:::mth
  N15417 --> N15421
  N15422[recordThought()]:::mth
  N15417 --> N15422
  N15424[File: contextManager.ts]:::file
  N11970 --> N15424
  N15425[Class: ContextManager]:::cls
  N15424 --> N15425
  N15426[refresh()]:::mth
  N15425 --> N15426
  N15427[loadGlobalMemory()]:::mth
  N15425 --> N15427
  N15428[loadEnvironmentMemory()]:::mth
  N15425 --> N15428
  N15429[discoverContext()]:::mth
  N15425 --> N15429
  N15430[emitMemoryChanged()]:::mth
  N15425 --> N15430
  N15434[File: fileDiscoveryService.ts]:::file
  N11970 --> N15434
  N15435[Class: FileDiscoveryService]:::cls
  N15434 --> N15435
  N15436[filterFiles()]:::mth
  N15435 --> N15436
  N15437[filterFilesWithReport()]:::mth
  N15435 --> N15437
  N15438[shouldIgnoreFile()]:::mth
  N15435 --> N15438
  N15440[File: fileSystemService.ts]:::file
  N11970 --> N15440
  N15441[Class: StandardFileSystemService]:::cls
  N15440 --> N15441
  N15442[readTextFile()]:::mth
  N15441 --> N15442
  N15443[readTextFile()]:::mth
  N15441 --> N15443
  N15444[writeTextFile()]:::mth
  N15441 --> N15444
  N15446[File: gitService.ts]:::file
  N11970 --> N15446
  N15447[Class: GitService]:::cls
  N15446 --> N15447
  N15448[getHistoryDir()]:::mth
  N15447 --> N15448
  N15449[initialize()]:::mth
  N15447 --> N15449
  N15450[verifyGitAvailability()]:::mth
  N15447 --> N15450
  N15451[setupShadowGitRepository()]:::mth
  N15447 --> N15451
  N15452[shadowGitRepository()]:::mth
  N15447 --> N15452
  N15454[File: loopDetectionService.ts]:::file
  N11970 --> N15454
  N15455[Class: LoopDetectionService]:::cls
  N15454 --> N15455
  N15456[disableForSession()]:::mth
  N15455 --> N15456
  N15457[getToolCallKey()]:::mth
  N15455 --> N15457
  N15458[addAndCheck()]:::mth
  N15455 --> N15458
  N15459[turnStarted()]:::mth
  N15455 --> N15459
  N15460[checkToolCallLoop()]:::mth
  N15455 --> N15460
  N15464[File: modelConfigService.ts]:::file
  N11970 --> N15464
  N15465[Class: ModelConfigService]:::cls
  N15464 --> N15465
  N15466[TODO()]:::mth
  N15465 --> N15466
  N15467[registerRuntimeModelConfig()]:::mth
  N15465 --> N15467
  N15468[registerRuntimeModelOverride()]:::mth
  N15465 --> N15468
  N15469[internalGetResolvedConfig()]:::mth
  N15465 --> N15469
  N15470[resolveAliasChain()]:::mth
  N15465 --> N15470
  N15473[File: sessionSummaryService.ts]:::file
  N11970 --> N15473
  N15474[Class: SessionSummaryService]:::cls
  N15473 --> N15474
  N15475[Summary()]:::mth
  N15474 --> N15475
  N15476[generateSummary()]:::mth
  N15474 --> N15476
  N15480[File: shellExecutionService.ts]:::file
  N11970 --> N15480
  N15481[Class: ShellExecutionService]:::cls
  N15480 --> N15481
  N15482[ensurePromptvarsDisabled()]:::mth
  N15481 --> N15482
  N15483[appendAndTruncate()]:::mth
  N15481 --> N15483
  N15484[cleanup()]:::mth
  N15481 --> N15484
  N15485[writeToPty()]:::mth
  N15481 --> N15485
  N15486[isPtyActive()]:::mth
  N15481 --> N15486
  N15490[File: skillManager.ts]:::file
  N11970 --> N15490
  N15491[Class: SkillManager]:::cls
  N15490 --> N15491
  N15492[clearSkills()]:::mth
  N15491 --> N15492
  N15493[setAdminSettings()]:::mth
  N15491 --> N15493
  N15494[isAdminEnabled()]:::mth
  N15491 --> N15494
  N15495[discoverSkills()]:::mth
  N15491 --> N15495
  N15496[discoverBuiltinSkills()]:::mth
  N15491 --> N15496
  N15498[File: activity-detector.ts]:::file
  N11970 --> N15498
  N15499[Class: ActivityDetector]:::cls
  N15498 --> N15499
  N15500[recordActivity()]:::mth
  N15499 --> N15500
  N15501[isUserActive()]:::mth
  N15499 --> N15501
  N15502[getTimeSinceLastActivity()]:::mth
  N15499 --> N15502
  N15503[getLastActivityTime()]:::mth
  N15499 --> N15503
  N15504[getActivityDetector()]:::mth
  N15499 --> N15504
  N15506[File: activity-monitor.ts]:::file
  N11970 --> N15506
  N15507[Class: that]:::cls
  N15506 --> N15507
  N15508[start()]:::mth
  N15507 --> N15508
  N15509[stop()]:::mth
  N15507 --> N15509
  N15510[addListener()]:::mth
  N15507 --> N15510
  N15511[removeListener()]:::mth
  N15507 --> N15511
  N15512[recordActivity()]:::mth
  N15507 --> N15512
  N15513[Class: ActivityMonitor]:::cls
  N15506 --> N15513
  N15514[start()]:::mth
  N15513 --> N15514
  N15515[stop()]:::mth
  N15513 --> N15515
  N15516[addListener()]:::mth
  N15513 --> N15516
  N15517[removeListener()]:::mth
  N15513 --> N15517
  N15518[recordActivity()]:::mth
  N15513 --> N15518
  N15521[File: clearcut-logger.ts]:::file
  N11970 --> N15521
  N15522[Class: for]:::cls
  N15521 --> N15522
  N15523[determineSurface()]:::mth
  N15522 --> N15523
  N15524[determineGHWorkflowName()]:::mth
  N15522 --> N15524
  N15525[determineGHRepositoryName()]:::mth
  N15522 --> N15525
  N15526[refreshGpuInfo()]:::mth
  N15522 --> N15526
  N15527[getGpuInfo()]:::mth
  N15522 --> N15527
  N15528[Class: ClearcutLogger]:::cls
  N15521 --> N15528
  N15529[determineSurface()]:::mth
  N15528 --> N15529
  N15530[determineGHWorkflowName()]:::mth
  N15528 --> N15530
  N15531[determineGHRepositoryName()]:::mth
  N15528 --> N15531
  N15532[refreshGpuInfo()]:::mth
  N15528 --> N15532
  N15533[getGpuInfo()]:::mth
  N15528 --> N15533
  N15538[File: file-exporters.ts]:::file
  N11970 --> N15538
  N15539[Class: FileExporter]:::cls
  N15538 --> N15539
  N15540[serialize()]:::mth
  N15539 --> N15540
  N15541[shutdown()]:::mth
  N15539 --> N15541
  N15542[getPreferredAggregationTemporality()]:::mth
  N15539 --> N15542
  N15543[forceFlush()]:::mth
  N15539 --> N15543
  N15544[Class: FileSpanExporter]:::cls
  N15538 --> N15544
  N15545[serialize()]:::mth
  N15544 --> N15545
  N15546[shutdown()]:::mth
  N15544 --> N15546
  N15547[getPreferredAggregationTemporality()]:::mth
  N15544 --> N15547
  N15548[forceFlush()]:::mth
  N15544 --> N15548
  N15549[Class: FileLogExporter]:::cls
  N15538 --> N15549
  N15550[serialize()]:::mth
  N15549 --> N15550
  N15551[shutdown()]:::mth
  N15549 --> N15551
  N15552[getPreferredAggregationTemporality()]:::mth
  N15549 --> N15552
  N15553[forceFlush()]:::mth
  N15549 --> N15553
  N15554[Class: FileMetricExporter]:::cls
  N15538 --> N15554
  N15555[serialize()]:::mth
  N15554 --> N15555
  N15556[shutdown()]:::mth
  N15554 --> N15556
  N15557[getPreferredAggregationTemporality()]:::mth
  N15554 --> N15557
  N15558[forceFlush()]:::mth
  N15554 --> N15558
  N15560[File: gcp-exporters.ts]:::file
  N11970 --> N15560
  N15561[Class: GcpTraceExporter]:::cls
  N15560 --> N15561
  N15562[forceFlush()]:::mth
  N15561 --> N15562
  N15563[shutdown()]:::mth
  N15561 --> N15563
  N15564[mapSeverityToCloudLogging()]:::mth
  N15561 --> N15564
  N15565[Class: GcpMetricExporter]:::cls
  N15560 --> N15565
  N15566[forceFlush()]:::mth
  N15565 --> N15566
  N15567[shutdown()]:::mth
  N15565 --> N15567
  N15568[mapSeverityToCloudLogging()]:::mth
  N15565 --> N15568
  N15569[Class: GcpLogExporter]:::cls
  N15560 --> N15569
  N15570[forceFlush()]:::mth
  N15569 --> N15570
  N15571[shutdown()]:::mth
  N15569 --> N15571
  N15572[mapSeverityToCloudLogging()]:::mth
  N15569 --> N15572
  N15574[File: high-water-mark-tracker.ts]:::file
  N11970 --> N15574
  N15575[Class: HighWaterMarkTracker]:::cls
  N15574 --> N15575
  N15576[shouldRecordMetric()]:::mth
  N15575 --> N15576
  N15577[getHighWaterMark()]:::mth
  N15575 --> N15577
  N15578[getAllHighWaterMarks()]:::mth
  N15575 --> N15578
  N15579[resetHighWaterMark()]:::mth
  N15575 --> N15579
  N15580[resetAllHighWaterMarks()]:::mth
  N15575 --> N15580
  N15587[File: memory-monitor.ts]:::file
  N11970 --> N15587
  N15588[Class: MemoryMonitor]:::cls
  N15587 --> N15588
  N15589[start()]:::mth
  N15588 --> N15589
  N15590[checkAndRecordIfNeeded()]:::mth
  N15588 --> N15590
  N15591[performPeriodicCleanup()]:::mth
  N15588 --> N15591
  N15592[stop()]:::mth
  N15588 --> N15592
  N15593[takeSnapshot()]:::mth
  N15588 --> N15593
  N15597[File: rate-limiter.ts]:::file
  N11970 --> N15597
  N15598[Class: RateLimiter]:::cls
  N15597 --> N15598
  N15599[shouldRecord()]:::mth
  N15598 --> N15599
  N15600[forceRecord()]:::mth
  N15598 --> N15600
  N15601[getTimeUntilNextAllowed()]:::mth
  N15598 --> N15601
  N15602[getStats()]:::mth
  N15598 --> N15602
  N15603[reset()]:::mth
  N15598 --> N15603
  N15607[File: sdk.ts]:::file
  N11970 --> N15607
  N15608[Class: DiagLoggerAdapter]:::cls
  N15607 --> N15608
  N15609[error()]:::mth
  N15608 --> N15609
  N15610[warn()]:::mth
  N15608 --> N15610
  N15611[info()]:::mth
  N15608 --> N15611
  N15612[debug()]:::mth
  N15608 --> N15612
  N15613[verbose()]:::mth
  N15608 --> N15613
  N15616[File: semantic.ts]:::file
  N11970 --> N15616
  N15617[Class: TextPart]:::cls
  N15616 --> N15617
  N15618[getStringReferences()]:::mth
  N15617 --> N15618
  N15619[limitTotalLength()]:::mth
  N15617 --> N15619
  N15620[toInputMessages()]:::mth
  N15617 --> N15620
  N15621[isPart()]:::mth
  N15617 --> N15621
  N15622[toPart()]:::mth
  N15617 --> N15622
  N15623[Class: ToolCallRequestPart]:::cls
  N15616 --> N15623
  N15624[getStringReferences()]:::mth
  N15623 --> N15624
  N15625[limitTotalLength()]:::mth
  N15623 --> N15625
  N15626[toInputMessages()]:::mth
  N15623 --> N15626
  N15627[isPart()]:::mth
  N15623 --> N15627
  N15628[toPart()]:::mth
  N15623 --> N15628
  N15629[Class: ToolCallResponsePart]:::cls
  N15616 --> N15629
  N15630[getStringReferences()]:::mth
  N15629 --> N15630
  N15631[limitTotalLength()]:::mth
  N15629 --> N15631
  N15632[toInputMessages()]:::mth
  N15629 --> N15632
  N15633[isPart()]:::mth
  N15629 --> N15633
  N15634[toPart()]:::mth
  N15629 --> N15634
  N15635[Class: ReasoningPart]:::cls
  N15616 --> N15635
  N15636[getStringReferences()]:::mth
  N15635 --> N15636
  N15637[limitTotalLength()]:::mth
  N15635 --> N15637
  N15638[toInputMessages()]:::mth
  N15635 --> N15638
  N15639[isPart()]:::mth
  N15635 --> N15639
  N15640[toPart()]:::mth
  N15635 --> N15640
  N15641[Class: GenericPart]:::cls
  N15616 --> N15641
  N15642[getStringReferences()]:::mth
  N15641 --> N15642
  N15643[limitTotalLength()]:::mth
  N15641 --> N15643
  N15644[toInputMessages()]:::mth
  N15641 --> N15644
  N15645[isPart()]:::mth
  N15641 --> N15645
  N15646[toPart()]:::mth
  N15641 --> N15646
  N15648[File: startupProfiler.ts]:::file
  N11970 --> N15648
  N15649[Class: StartupProfiler]:::cls
  N15648 --> N15649
  N15650[end()]:::mth
  N15649 --> N15650
  N15651[getInstance()]:::mth
  N15649 --> N15651
  N15652[getStartMarkName()]:::mth
  N15649 --> N15652
  N15653[getEndMarkName()]:::mth
  N15649 --> N15653
  N15654[start()]:::mth
  N15649 --> N15654
  N15661[File: types.ts]:::file
  N11970 --> N15661
  N15662[Class: StartSessionEvent]:::cls
  N15661 --> N15662
  N15663[toOpenTelemetryAttributes()]:::mth
  N15662 --> N15663
  N15664[toLogBody()]:::mth
  N15662 --> N15664
  N15665[toOpenTelemetryAttributes()]:::mth
  N15662 --> N15665
  N15666[toLogBody()]:::mth
  N15662 --> N15666
  N15667[toOpenTelemetryAttributes()]:::mth
  N15662 --> N15667
  N15668[Class: EndSessionEvent]:::cls
  N15661 --> N15668
  N15669[toOpenTelemetryAttributes()]:::mth
  N15668 --> N15669
  N15670[toLogBody()]:::mth
  N15668 --> N15670
  N15671[toOpenTelemetryAttributes()]:::mth
  N15668 --> N15671
  N15672[toLogBody()]:::mth
  N15668 --> N15672
  N15673[toOpenTelemetryAttributes()]:::mth
  N15668 --> N15673
  N15674[Class: UserPromptEvent]:::cls
  N15661 --> N15674
  N15675[toOpenTelemetryAttributes()]:::mth
  N15674 --> N15675
  N15676[toLogBody()]:::mth
  N15674 --> N15676
  N15677[toOpenTelemetryAttributes()]:::mth
  N15674 --> N15677
  N15678[toLogBody()]:::mth
  N15674 --> N15678
  N15679[toOpenTelemetryAttributes()]:::mth
  N15674 --> N15679
  N15680[Class: ToolCallEvent]:::cls
  N15661 --> N15680
  N15681[toOpenTelemetryAttributes()]:::mth
  N15680 --> N15681
  N15682[toLogBody()]:::mth
  N15680 --> N15682
  N15683[toOpenTelemetryAttributes()]:::mth
  N15680 --> N15683
  N15684[toLogBody()]:::mth
  N15680 --> N15684
  N15685[toOpenTelemetryAttributes()]:::mth
  N15680 --> N15685
  N15686[Class: ApiRequestEvent]:::cls
  N15661 --> N15686
  N15687[toOpenTelemetryAttributes()]:::mth
  N15686 --> N15687
  N15688[toLogBody()]:::mth
  N15686 --> N15688
  N15689[toOpenTelemetryAttributes()]:::mth
  N15686 --> N15689
  N15690[toLogBody()]:::mth
  N15686 --> N15690
  N15691[toOpenTelemetryAttributes()]:::mth
  N15686 --> N15691
  N15692[Class: ApiErrorEvent]:::cls
  N15661 --> N15692
  N15693[toOpenTelemetryAttributes()]:::mth
  N15692 --> N15693
  N15694[toLogBody()]:::mth
  N15692 --> N15694
  N15695[toOpenTelemetryAttributes()]:::mth
  N15692 --> N15695
  N15696[toLogBody()]:::mth
  N15692 --> N15696
  N15697[toOpenTelemetryAttributes()]:::mth
  N15692 --> N15697
  N15698[Class: ApiResponseEvent]:::cls
  N15661 --> N15698
  N15699[toOpenTelemetryAttributes()]:::mth
  N15698 --> N15699
  N15700[toLogBody()]:::mth
  N15698 --> N15700
  N15701[toOpenTelemetryAttributes()]:::mth
  N15698 --> N15701
  N15702[toLogBody()]:::mth
  N15698 --> N15702
  N15703[toOpenTelemetryAttributes()]:::mth
  N15698 --> N15703
  N15704[Class: FlashFallbackEvent]:::cls
  N15661 --> N15704
  N15705[toOpenTelemetryAttributes()]:::mth
  N15704 --> N15705
  N15706[toLogBody()]:::mth
  N15704 --> N15706
  N15707[toOpenTelemetryAttributes()]:::mth
  N15704 --> N15707
  N15708[toLogBody()]:::mth
  N15704 --> N15708
  N15709[toOpenTelemetryAttributes()]:::mth
  N15704 --> N15709
  N15710[Class: RipgrepFallbackEvent]:::cls
  N15661 --> N15710
  N15711[toOpenTelemetryAttributes()]:::mth
  N15710 --> N15711
  N15712[toLogBody()]:::mth
  N15710 --> N15712
  N15713[toOpenTelemetryAttributes()]:::mth
  N15710 --> N15713
  N15714[toLogBody()]:::mth
  N15710 --> N15714
  N15715[toOpenTelemetryAttributes()]:::mth
  N15710 --> N15715
  N15716[Class: LoopDetectedEvent]:::cls
  N15661 --> N15716
  N15717[toOpenTelemetryAttributes()]:::mth
  N15716 --> N15717
  N15718[toLogBody()]:::mth
  N15716 --> N15718
  N15719[toOpenTelemetryAttributes()]:::mth
  N15716 --> N15719
  N15720[toLogBody()]:::mth
  N15716 --> N15720
  N15721[toOpenTelemetryAttributes()]:::mth
  N15716 --> N15721
  N15722[Class: LoopDetectionDisabledEvent]:::cls
  N15661 --> N15722
  N15723[toOpenTelemetryAttributes()]:::mth
  N15722 --> N15723
  N15724[toLogBody()]:::mth
  N15722 --> N15724
  N15725[toOpenTelemetryAttributes()]:::mth
  N15722 --> N15725
  N15726[toLogBody()]:::mth
  N15722 --> N15726
  N15727[toOpenTelemetryAttributes()]:::mth
  N15722 --> N15727
  N15728[Class: NextSpeakerCheckEvent]:::cls
  N15661 --> N15728
  N15729[toOpenTelemetryAttributes()]:::mth
  N15728 --> N15729
  N15730[toLogBody()]:::mth
  N15728 --> N15730
  N15731[toOpenTelemetryAttributes()]:::mth
  N15728 --> N15731
  N15732[toLogBody()]:::mth
  N15728 --> N15732
  N15733[toOpenTelemetryAttributes()]:::mth
  N15728 --> N15733
  N15734[Class: MalformedJsonResponseEvent]:::cls
  N15661 --> N15734
  N15735[toOpenTelemetryAttributes()]:::mth
  N15734 --> N15735
  N15736[toLogBody()]:::mth
  N15734 --> N15736
  N15737[toOpenTelemetryAttributes()]:::mth
  N15734 --> N15737
  N15738[toLogBody()]:::mth
  N15734 --> N15738
  N15739[toOpenTelemetryAttributes()]:::mth
  N15734 --> N15739
  N15740[Class: IdeConnectionEvent]:::cls
  N15661 --> N15740
  N15741[toOpenTelemetryAttributes()]:::mth
  N15740 --> N15741
  N15742[toLogBody()]:::mth
  N15740 --> N15742
  N15743[toOpenTelemetryAttributes()]:::mth
  N15740 --> N15743
  N15744[toLogBody()]:::mth
  N15740 --> N15744
  N15745[toOpenTelemetryAttributes()]:::mth
  N15740 --> N15745
  N15746[Class: ConversationFinishedEvent]:::cls
  N15661 --> N15746
  N15747[toOpenTelemetryAttributes()]:::mth
  N15746 --> N15747
  N15748[toLogBody()]:::mth
  N15746 --> N15748
  N15749[toOpenTelemetryAttributes()]:::mth
  N15746 --> N15749
  N15750[toLogBody()]:::mth
  N15746 --> N15750
  N15751[toOpenTelemetryAttributes()]:::mth
  N15746 --> N15751
  N15752[Class: FileOperationEvent]:::cls
  N15661 --> N15752
  N15753[toOpenTelemetryAttributes()]:::mth
  N15752 --> N15753
  N15754[toLogBody()]:::mth
  N15752 --> N15754
  N15755[toOpenTelemetryAttributes()]:::mth
  N15752 --> N15755
  N15756[toLogBody()]:::mth
  N15752 --> N15756
  N15757[toOpenTelemetryAttributes()]:::mth
  N15752 --> N15757
  N15758[Class: InvalidChunkEvent]:::cls
  N15661 --> N15758
  N15759[toOpenTelemetryAttributes()]:::mth
  N15758 --> N15759
  N15760[toLogBody()]:::mth
  N15758 --> N15760
  N15761[toOpenTelemetryAttributes()]:::mth
  N15758 --> N15761
  N15762[toLogBody()]:::mth
  N15758 --> N15762
  N15763[toOpenTelemetryAttributes()]:::mth
  N15758 --> N15763
  N15764[Class: ContentRetryEvent]:::cls
  N15661 --> N15764
  N15765[toOpenTelemetryAttributes()]:::mth
  N15764 --> N15765
  N15766[toLogBody()]:::mth
  N15764 --> N15766
  N15767[toOpenTelemetryAttributes()]:::mth
  N15764 --> N15767
  N15768[toLogBody()]:::mth
  N15764 --> N15768
  N15769[toOpenTelemetryAttributes()]:::mth
  N15764 --> N15769
  N15770[Class: ContentRetryFailureEvent]:::cls
  N15661 --> N15770
  N15771[toOpenTelemetryAttributes()]:::mth
  N15770 --> N15771
  N15772[toLogBody()]:::mth
  N15770 --> N15772
  N15773[toOpenTelemetryAttributes()]:::mth
  N15770 --> N15773
  N15774[toLogBody()]:::mth
  N15770 --> N15774
  N15775[toOpenTelemetryAttributes()]:::mth
  N15770 --> N15775
  N15776[Class: ModelRoutingEvent]:::cls
  N15661 --> N15776
  N15777[toOpenTelemetryAttributes()]:::mth
  N15776 --> N15777
  N15778[toLogBody()]:::mth
  N15776 --> N15778
  N15779[toOpenTelemetryAttributes()]:::mth
  N15776 --> N15779
  N15780[toLogBody()]:::mth
  N15776 --> N15780
  N15781[toOpenTelemetryAttributes()]:::mth
  N15776 --> N15781
  N15782[Class: ExtensionInstallEvent]:::cls
  N15661 --> N15782
  N15783[toOpenTelemetryAttributes()]:::mth
  N15782 --> N15783
  N15784[toLogBody()]:::mth
  N15782 --> N15784
  N15785[toOpenTelemetryAttributes()]:::mth
  N15782 --> N15785
  N15786[toLogBody()]:::mth
  N15782 --> N15786
  N15787[toOpenTelemetryAttributes()]:::mth
  N15782 --> N15787
  N15788[Class: ToolOutputTruncatedEvent]:::cls
  N15661 --> N15788
  N15789[toOpenTelemetryAttributes()]:::mth
  N15788 --> N15789
  N15790[toLogBody()]:::mth
  N15788 --> N15790
  N15791[toOpenTelemetryAttributes()]:::mth
  N15788 --> N15791
  N15792[toLogBody()]:::mth
  N15788 --> N15792
  N15793[toOpenTelemetryAttributes()]:::mth
  N15788 --> N15793
  N15794[Class: ExtensionUninstallEvent]:::cls
  N15661 --> N15794
  N15795[toOpenTelemetryAttributes()]:::mth
  N15794 --> N15795
  N15796[toLogBody()]:::mth
  N15794 --> N15796
  N15797[toOpenTelemetryAttributes()]:::mth
  N15794 --> N15797
  N15798[toLogBody()]:::mth
  N15794 --> N15798
  N15799[toOpenTelemetryAttributes()]:::mth
  N15794 --> N15799
  N15800[Class: ExtensionUpdateEvent]:::cls
  N15661 --> N15800
  N15801[toOpenTelemetryAttributes()]:::mth
  N15800 --> N15801
  N15802[toLogBody()]:::mth
  N15800 --> N15802
  N15803[toOpenTelemetryAttributes()]:::mth
  N15800 --> N15803
  N15804[toLogBody()]:::mth
  N15800 --> N15804
  N15805[toOpenTelemetryAttributes()]:::mth
  N15800 --> N15805
  N15806[Class: ExtensionEnableEvent]:::cls
  N15661 --> N15806
  N15807[toOpenTelemetryAttributes()]:::mth
  N15806 --> N15807
  N15808[toLogBody()]:::mth
  N15806 --> N15808
  N15809[toOpenTelemetryAttributes()]:::mth
  N15806 --> N15809
  N15810[toLogBody()]:::mth
  N15806 --> N15810
  N15811[toOpenTelemetryAttributes()]:::mth
  N15806 --> N15811
  N15812[Class: ModelSlashCommandEvent]:::cls
  N15661 --> N15812
  N15813[toOpenTelemetryAttributes()]:::mth
  N15812 --> N15813
  N15814[toLogBody()]:::mth
  N15812 --> N15814
  N15815[toOpenTelemetryAttributes()]:::mth
  N15812 --> N15815
  N15816[toLogBody()]:::mth
  N15812 --> N15816
  N15817[toOpenTelemetryAttributes()]:::mth
  N15812 --> N15817
  N15818[Class: LlmLoopCheckEvent]:::cls
  N15661 --> N15818
  N15819[toOpenTelemetryAttributes()]:::mth
  N15818 --> N15819
  N15820[toLogBody()]:::mth
  N15818 --> N15820
  N15821[toOpenTelemetryAttributes()]:::mth
  N15818 --> N15821
  N15822[toLogBody()]:::mth
  N15818 --> N15822
  N15823[toOpenTelemetryAttributes()]:::mth
  N15818 --> N15823
  N15824[Class: ExtensionDisableEvent]:::cls
  N15661 --> N15824
  N15825[toOpenTelemetryAttributes()]:::mth
  N15824 --> N15825
  N15826[toLogBody()]:::mth
  N15824 --> N15826
  N15827[toOpenTelemetryAttributes()]:::mth
  N15824 --> N15827
  N15828[toLogBody()]:::mth
  N15824 --> N15828
  N15829[toOpenTelemetryAttributes()]:::mth
  N15824 --> N15829
  N15830[Class: EditStrategyEvent]:::cls
  N15661 --> N15830
  N15831[toOpenTelemetryAttributes()]:::mth
  N15830 --> N15831
  N15832[toLogBody()]:::mth
  N15830 --> N15832
  N15833[toOpenTelemetryAttributes()]:::mth
  N15830 --> N15833
  N15834[toLogBody()]:::mth
  N15830 --> N15834
  N15835[toOpenTelemetryAttributes()]:::mth
  N15830 --> N15835
  N15836[Class: EditCorrectionEvent]:::cls
  N15661 --> N15836
  N15837[toOpenTelemetryAttributes()]:::mth
  N15836 --> N15837
  N15838[toLogBody()]:::mth
  N15836 --> N15838
  N15839[toOpenTelemetryAttributes()]:::mth
  N15836 --> N15839
  N15840[toLogBody()]:::mth
  N15836 --> N15840
  N15841[toOpenTelemetryAttributes()]:::mth
  N15836 --> N15841
  N15842[Class: StartupStatsEvent]:::cls
  N15661 --> N15842
  N15843[toOpenTelemetryAttributes()]:::mth
  N15842 --> N15843
  N15844[toLogBody()]:::mth
  N15842 --> N15844
  N15845[toOpenTelemetryAttributes()]:::mth
  N15842 --> N15845
  N15846[toLogBody()]:::mth
  N15842 --> N15846
  N15847[toOpenTelemetryAttributes()]:::mth
  N15842 --> N15847
  N15848[Class: BaseAgentEvent]:::cls
  N15661 --> N15848
  N15849[toOpenTelemetryAttributes()]:::mth
  N15848 --> N15849
  N15850[toLogBody()]:::mth
  N15848 --> N15850
  N15851[toOpenTelemetryAttributes()]:::mth
  N15848 --> N15851
  N15852[toLogBody()]:::mth
  N15848 --> N15852
  N15853[toOpenTelemetryAttributes()]:::mth
  N15848 --> N15853
  N15854[Class: AgentStartEvent]:::cls
  N15661 --> N15854
  N15855[toOpenTelemetryAttributes()]:::mth
  N15854 --> N15855
  N15856[toLogBody()]:::mth
  N15854 --> N15856
  N15857[toOpenTelemetryAttributes()]:::mth
  N15854 --> N15857
  N15858[toLogBody()]:::mth
  N15854 --> N15858
  N15859[toOpenTelemetryAttributes()]:::mth
  N15854 --> N15859
  N15860[Class: AgentFinishEvent]:::cls
  N15661 --> N15860
  N15861[toOpenTelemetryAttributes()]:::mth
  N15860 --> N15861
  N15862[toLogBody()]:::mth
  N15860 --> N15862
  N15863[toOpenTelemetryAttributes()]:::mth
  N15860 --> N15863
  N15864[toLogBody()]:::mth
  N15860 --> N15864
  N15865[toOpenTelemetryAttributes()]:::mth
  N15860 --> N15865
  N15866[Class: RecoveryAttemptEvent]:::cls
  N15661 --> N15866
  N15867[toOpenTelemetryAttributes()]:::mth
  N15866 --> N15867
  N15868[toLogBody()]:::mth
  N15866 --> N15868
  N15869[toOpenTelemetryAttributes()]:::mth
  N15866 --> N15869
  N15870[toLogBody()]:::mth
  N15866 --> N15870
  N15871[toOpenTelemetryAttributes()]:::mth
  N15866 --> N15871
  N15872[Class: WebFetchFallbackAttemptEvent]:::cls
  N15661 --> N15872
  N15873[toOpenTelemetryAttributes()]:::mth
  N15872 --> N15873
  N15874[toLogBody()]:::mth
  N15872 --> N15874
  N15875[toOpenTelemetryAttributes()]:::mth
  N15872 --> N15875
  N15876[toLogBody()]:::mth
  N15872 --> N15876
  N15877[toOpenTelemetryAttributes()]:::mth
  N15872 --> N15877
  N15878[Class: HookCallEvent]:::cls
  N15661 --> N15878
  N15879[toOpenTelemetryAttributes()]:::mth
  N15878 --> N15879
  N15880[toLogBody()]:::mth
  N15878 --> N15880
  N15881[toOpenTelemetryAttributes()]:::mth
  N15878 --> N15881
  N15882[toLogBody()]:::mth
  N15878 --> N15882
  N15883[toOpenTelemetryAttributes()]:::mth
  N15878 --> N15883
  N15885[File: uiTelemetry.ts]:::file
  N11970 --> N15885
  N15886[Class: UiTelemetryService]:::cls
  N15885 --> N15886
  N15887[addEvent()]:::mth
  N15886 --> N15887
  N15888[getMetrics()]:::mth
  N15886 --> N15888
  N15889[getLastPromptTokenCount()]:::mth
  N15886 --> N15889
  N15890[setLastPromptTokenCount()]:::mth
  N15886 --> N15890
  N15891[getOrCreateModelMetrics()]:::mth
  N15886 --> N15891
  N15894[File: mock-message-bus.ts]:::file
  N11970 --> N15894
  N15895[Class: MockMessageBus]:::cls
  N15894 --> N15895
  N15896[emit()]:::mth
  N15895 --> N15896
  N15897[triggerHookResponse()]:::mth
  N15895 --> N15897
  N15898[getLastHookRequest()]:::mth
  N15895 --> N15898
  N15899[getHookRequestsForEvent()]:::mth
  N15895 --> N15899
  N15900[clear()]:::mth
  N15895 --> N15900
  N15901[File: mock-tool.ts]:::file
  N11970 --> N15901
  N15902[Class: MockToolInvocation]:::cls
  N15901 --> N15902
  N15903[shouldConfirmExecute()]:::mth
  N15902 --> N15903
  N15904[getDescription()]:::mth
  N15902 --> N15904
  N15905[createInvocation()]:::mth
  N15902 --> N15905
  N15906[execute()]:::mth
  N15902 --> N15906
  N15907[shouldConfirmExecute()]:::mth
  N15902 --> N15907
  N15908[Class: MockTool]:::cls
  N15901 --> N15908
  N15909[shouldConfirmExecute()]:::mth
  N15908 --> N15909
  N15910[getDescription()]:::mth
  N15908 --> N15910
  N15911[createInvocation()]:::mth
  N15908 --> N15911
  N15912[execute()]:::mth
  N15908 --> N15912
  N15913[shouldConfirmExecute()]:::mth
  N15908 --> N15913
  N15914[Class: MockModifiableToolInvocation]:::cls
  N15901 --> N15914
  N15915[shouldConfirmExecute()]:::mth
  N15914 --> N15915
  N15916[getDescription()]:::mth
  N15914 --> N15916
  N15917[createInvocation()]:::mth
  N15914 --> N15917
  N15918[execute()]:::mth
  N15914 --> N15918
  N15919[shouldConfirmExecute()]:::mth
  N15914 --> N15919
  N15920[Class: MockModifiableTool]:::cls
  N15901 --> N15920
  N15921[shouldConfirmExecute()]:::mth
  N15920 --> N15921
  N15922[getDescription()]:::mth
  N15920 --> N15922
  N15923[createInvocation()]:::mth
  N15920 --> N15923
  N15924[execute()]:::mth
  N15920 --> N15924
  N15925[shouldConfirmExecute()]:::mth
  N15920 --> N15925
  N15928[File: activate-skill.ts]:::file
  N11970 --> N15928
  N15929[Class: ActivateSkillToolInvocation]:::cls
  N15928 --> N15929
  N15930[getDescription()]:::mth
  N15929 --> N15930
  N15931[getOrFetchFolderStructure()]:::mth
  N15929 --> N15931
  N15932[getConfirmationDetails()]:::mth
  N15929 --> N15932
  N15933[execute()]:::mth
  N15929 --> N15933
  N15934[createInvocation()]:::mth
  N15929 --> N15934
  N15935[Class: ActivateSkillTool]:::cls
  N15928 --> N15935
  N15936[getDescription()]:::mth
  N15935 --> N15936
  N15937[getOrFetchFolderStructure()]:::mth
  N15935 --> N15937
  N15938[getConfirmationDetails()]:::mth
  N15935 --> N15938
  N15939[execute()]:::mth
  N15935 --> N15939
  N15940[createInvocation()]:::mth
  N15935 --> N15940
  N15941[File: base-tool-invocation.test.ts]:::file
  N11970 --> N15941
  N15942[Class: TestBaseToolInvocation]:::cls
  N15941 --> N15942
  N15943[getDescription()]:::mth
  N15942 --> N15943
  N15944[execute()]:::mth
  N15942 --> N15944
  N15949[File: edit.ts]:::file
  N11970 --> N15949
  N15950[Class: EditToolInvocation]:::cls
  N15949 --> N15950
  N15951[applyReplacement()]:::mth
  N15950 --> N15951
  N15952[hashContent()]:::mth
  N15950 --> N15952
  N15953[restoreTrailingNewline()]:::mth
  N15950 --> N15953
  N15954[escapeRegex()]:::mth
  N15950 --> N15954
  N15955[calculateExactReplacement()]:::mth
  N15950 --> N15955
  N15956[Class: EditTool]:::cls
  N15949 --> N15956
  N15957[applyReplacement()]:::mth
  N15956 --> N15957
  N15958[hashContent()]:::mth
  N15956 --> N15958
  N15959[restoreTrailingNewline()]:::mth
  N15956 --> N15959
  N15960[escapeRegex()]:::mth
  N15956 --> N15960
  N15961[calculateExactReplacement()]:::mth
  N15956 --> N15961
  N15963[File: get-internal-docs.ts]:::file
  N11970 --> N15963
  N15964[Class: GetInternalDocsInvocation]:::cls
  N15963 --> N15964
  N15965[getDocsRoot()]:::mth
  N15964 --> N15965
  N15966[shouldConfirmExecute()]:::mth
  N15964 --> N15966
  N15967[getDescription()]:::mth
  N15964 --> N15967
  N15968[execute()]:::mth
  N15964 --> N15968
  N15969[createInvocation()]:::mth
  N15964 --> N15969
  N15970[Class: GetInternalDocsTool]:::cls
  N15963 --> N15970
  N15971[getDocsRoot()]:::mth
  N15970 --> N15971
  N15972[shouldConfirmExecute()]:::mth
  N15970 --> N15972
  N15973[getDescription()]:::mth
  N15970 --> N15973
  N15974[execute()]:::mth
  N15970 --> N15974
  N15975[createInvocation()]:::mth
  N15970 --> N15975
  N15977[File: glob.ts]:::file
  N11970 --> N15977
  N15978[Class: GlobToolInvocation]:::cls
  N15977 --> N15978
  N15979[fullpath()]:::mth
  N15978 --> N15979
  N15980[getDescription()]:::mth
  N15978 --> N15980
  N15981[execute()]:::mth
  N15978 --> N15981
  N15982[time()]:::mth
  N15978 --> N15982
  N15983[validateToolParamValues()]:::mth
  N15978 --> N15983
  N15984[Class: GlobTool]:::cls
  N15977 --> N15984
  N15985[fullpath()]:::mth
  N15984 --> N15985
  N15986[getDescription()]:::mth
  N15984 --> N15986
  N15987[execute()]:::mth
  N15984 --> N15987
  N15988[time()]:::mth
  N15984 --> N15988
  N15989[validateToolParamValues()]:::mth
  N15984 --> N15989
  N15991[File: grep.ts]:::file
  N11970 --> N15991
  N15992[Class: GrepToolInvocation]:::cls
  N15991 --> N15992
  N15993[resolveAndValidatePath()]:::mth
  N15992 --> N15993
  N15994[execute()]:::mth
  N15992 --> N15994
  N15995[isCommandAvailable()]:::mth
  N15992 --> N15995
  N15996[parseGrepOutput()]:::mth
  N15992 --> N15996
  N15997[getDescription()]:::mth
  N15992 --> N15997
  N15998[Class: GrepTool]:::cls
  N15991 --> N15998
  N15999[resolveAndValidatePath()]:::mth
  N15998 --> N15999
  N16000[execute()]:::mth
  N15998 --> N16000
  N16001[isCommandAvailable()]:::mth
  N15998 --> N16001
  N16002[parseGrepOutput()]:::mth
  N15998 --> N16002
  N16003[getDescription()]:::mth
  N15998 --> N16003
  N16005[File: ls.ts]:::file
  N11970 --> N16005
  N16006[Class: LSToolInvocation]:::cls
  N16005 --> N16006
  N16007[shouldIgnore()]:::mth
  N16006 --> N16007
  N16008[getDescription()]:::mth
  N16006 --> N16008
  N16009[errorResult()]:::mth
  N16006 --> N16009
  N16010[execute()]:::mth
  N16006 --> N16010
  N16011[validateToolParamValues()]:::mth
  N16006 --> N16011
  N16012[Class: LSTool]:::cls
  N16005 --> N16012
  N16013[shouldIgnore()]:::mth
  N16012 --> N16013
  N16014[getDescription()]:::mth
  N16012 --> N16014
  N16015[errorResult()]:::mth
  N16012 --> N16015
  N16016[execute()]:::mth
  N16012 --> N16016
  N16017[validateToolParamValues()]:::mth
  N16012 --> N16017
  N16019[File: mcp-client-manager.ts]:::file
  N11970 --> N16019
  N16020[Class: is]:::cls
  N16019 --> N16020
  N16021[getBlockedMcpServers()]:::mth
  N16020 --> N16021
  N16022[getClient()]:::mth
  N16020 --> N16022
  N16023[stopExtension()]:::mth
  N16020 --> N16023
  N16024[startExtension()]:::mth
  N16020 --> N16024
  N16025[isAllowedMcpServer()]:::mth
  N16020 --> N16025
  N16026[Class: McpClientManager]:::cls
  N16019 --> N16026
  N16027[getBlockedMcpServers()]:::mth
  N16026 --> N16027
  N16028[getClient()]:::mth
  N16026 --> N16028
  N16029[stopExtension()]:::mth
  N16026 --> N16029
  N16030[startExtension()]:::mth
  N16026 --> N16030
  N16031[isAllowedMcpServer()]:::mth
  N16026 --> N16031
  N16033[File: mcp-client.ts]:::file
  N11970 --> N16033
  N16034[Class: is]:::cls
  N16033 --> N16034
  N16035[connect()]:::mth
  N16034 --> N16035
  N16036[discover()]:::mth
  N16034 --> N16036
  N16037[disconnect()]:::mth
  N16034 --> N16037
  N16038[getStatus()]:::mth
  N16034 --> N16038
  N16039[updateStatus()]:::mth
  N16034 --> N16039
  N16040[Class: McpClient]:::cls
  N16033 --> N16040
  N16041[connect()]:::mth
  N16040 --> N16041
  N16042[discover()]:::mth
  N16040 --> N16042
  N16043[disconnect()]:::mth
  N16040 --> N16043
  N16044[getStatus()]:::mth
  N16040 --> N16044
  N16045[updateStatus()]:::mth
  N16040 --> N16045
  N16046[Class: LenientJsonSchemaValidator]:::cls
  N16033 --> N16046
  N16047[connect()]:::mth
  N16046 --> N16047
  N16048[discover()]:::mth
  N16046 --> N16048
  N16049[disconnect()]:::mth
  N16046 --> N16049
  N16050[getStatus()]:::mth
  N16046 --> N16050
  N16051[updateStatus()]:::mth
  N16046 --> N16051
  N16052[Class: McpCallableTool]:::cls
  N16033 --> N16052
  N16053[connect()]:::mth
  N16052 --> N16053
  N16054[discover()]:::mth
  N16052 --> N16054
  N16055[disconnect()]:::mth
  N16052 --> N16055
  N16056[getStatus()]:::mth
  N16052 --> N16056
  N16057[updateStatus()]:::mth
  N16052 --> N16057
  N16059[File: mcp-tool.ts]:::file
  N11970 --> N16059
  N16060[Class: DiscoveredMCPToolInvocation]:::cls
  N16059 --> N16060
  N16061[getPolicyUpdateOptions()]:::mth
  N16060 --> N16061
  N16062[getConfirmationDetails()]:::mth
  N16060 --> N16062
  N16063[isMCPToolError()]:::mth
  N16060 --> N16063
  N16064[execute()]:::mth
  N16060 --> N16064
  N16065[getDescription()]:::mth
  N16060 --> N16065
  N16066[Class: DiscoveredMCPTool]:::cls
  N16059 --> N16066
  N16067[getPolicyUpdateOptions()]:::mth
  N16066 --> N16067
  N16068[getConfirmationDetails()]:::mth
  N16066 --> N16068
  N16069[isMCPToolError()]:::mth
  N16066 --> N16069
  N16070[execute()]:::mth
  N16066 --> N16070
  N16071[getDescription()]:::mth
  N16066 --> N16071
  N16073[File: memoryTool.ts]:::file
  N11970 --> N16073
  N16074[Class: MemoryToolInvocation]:::cls
  N16073 --> N16074
  N16075[setGeminiMdFilename()]:::mth
  N16074 --> N16075
  N16076[getCurrentGeminiMdFilename()]:::mth
  N16074 --> N16076
  N16077[getAllGeminiMdFilenames()]:::mth
  N16074 --> N16077
  N16078[getGlobalMemoryFilePath()]:::mth
  N16074 --> N16078
  N16079[ensureNewlineSeparation()]:::mth
  N16074 --> N16079
  N16080[Class: MemoryTool]:::cls
  N16073 --> N16080
  N16081[setGeminiMdFilename()]:::mth
  N16080 --> N16081
  N16082[getCurrentGeminiMdFilename()]:::mth
  N16080 --> N16082
  N16083[getAllGeminiMdFilenames()]:::mth
  N16080 --> N16083
  N16084[getGlobalMemoryFilePath()]:::mth
  N16080 --> N16084
  N16085[ensureNewlineSeparation()]:::mth
  N16080 --> N16085
  N16086[File: message-bus-integration.test.ts]:::file
  N11970 --> N16086
  N16087[Class: TestToolInvocation]:::cls
  N16086 --> N16087
  N16088[getDescription()]:::mth
  N16087 --> N16088
  N16089[execute()]:::mth
  N16087 --> N16089
  N16090[shouldConfirmExecute()]:::mth
  N16087 --> N16090
  N16091[createInvocation()]:::mth
  N16087 --> N16091
  N16092[Class: TestTool]:::cls
  N16086 --> N16092
  N16093[getDescription()]:::mth
  N16092 --> N16093
  N16094[execute()]:::mth
  N16092 --> N16094
  N16095[shouldConfirmExecute()]:::mth
  N16092 --> N16095
  N16096[createInvocation()]:::mth
  N16092 --> N16096
  N16100[File: read-file.ts]:::file
  N11970 --> N16100
  N16101[Class: ReadFileToolInvocation]:::cls
  N16100 --> N16101
  N16102[getDescription()]:::mth
  N16101 --> N16102
  N16103[toolLocations()]:::mth
  N16101 --> N16103
  N16104[execute()]:::mth
  N16101 --> N16104
  N16105[validateToolParamValues()]:::mth
  N16101 --> N16105
  N16106[createInvocation()]:::mth
  N16101 --> N16106
  N16107[Class: ReadFileTool]:::cls
  N16100 --> N16107
  N16108[getDescription()]:::mth
  N16107 --> N16108
  N16109[toolLocations()]:::mth
  N16107 --> N16109
  N16110[execute()]:::mth
  N16107 --> N16110
  N16111[validateToolParamValues()]:::mth
  N16107 --> N16111
  N16112[createInvocation()]:::mth
  N16107 --> N16112
  N16114[File: read-many-files.ts]:::file
  N11970 --> N16114
  N16115[Class: ReadManyFilesToolInvocation]:::cls
  N16114 --> N16115
  N16116[TODO()]:::mth
  N16115 --> N16116
  N16117[getDescription()]:::mth
  N16115 --> N16117
  N16118[execute()]:::mth
  N16115 --> N16118
  N16119[async()]:::mth
  N16115 --> N16119
  N16120[Files()]:::mth
  N16115 --> N16120
  N16121[Class: ReadManyFilesTool]:::cls
  N16114 --> N16121
  N16122[TODO()]:::mth
  N16121 --> N16122
  N16123[getDescription()]:::mth
  N16121 --> N16123
  N16124[execute()]:::mth
  N16121 --> N16124
  N16125[async()]:::mth
  N16121 --> N16125
  N16126[Files()]:::mth
  N16121 --> N16126
  N16128[File: ripGrep.ts]:::file
  N11970 --> N16128
  N16129[Class: GrepToolInvocation]:::cls
  N16128 --> N16129
  N16130[getRgCandidateFilenames()]:::mth
  N16129 --> N16130
  N16131[resolveExistingRgPath()]:::mth
  N16129 --> N16131
  N16132[ensureRipgrepAvailable()]:::mth
  N16129 --> N16132
  N16133[canUseRipgrep()]:::mth
  N16129 --> N16133
  N16134[ensureRgPath()]:::mth
  N16129 --> N16134
  N16135[Class: RipGrepTool]:::cls
  N16128 --> N16135
  N16136[getRgCandidateFilenames()]:::mth
  N16135 --> N16136
  N16137[resolveExistingRgPath()]:::mth
  N16135 --> N16137
  N16138[ensureRipgrepAvailable()]:::mth
  N16135 --> N16138
  N16139[canUseRipgrep()]:::mth
  N16135 --> N16139
  N16140[ensureRgPath()]:::mth
  N16135 --> N16140
  N16142[File: shell.ts]:::file
  N11970 --> N16142
  N16143[Class: ShellToolInvocation]:::cls
  N16142 --> N16143
  N16144[getDescription()]:::mth
  N16143 --> N16144
  N16145[getPolicyUpdateOptions()]:::mth
  N16143 --> N16145
  N16146[getConfirmationDetails()]:::mth
  N16143 --> N16146
  N16147[getShellToolDescription()]:::mth
  N16143 --> N16147
  N16148[getCommandDescription()]:::mth
  N16143 --> N16148
  N16149[Class: ShellTool]:::cls
  N16142 --> N16149
  N16150[getDescription()]:::mth
  N16149 --> N16150
  N16151[getPolicyUpdateOptions()]:::mth
  N16149 --> N16151
  N16152[getConfirmationDetails()]:::mth
  N16149 --> N16152
  N16153[getShellToolDescription()]:::mth
  N16149 --> N16153
  N16154[getCommandDescription()]:::mth
  N16149 --> N16154
  N16158[File: tool-registry.test.ts]:::file
  N11970 --> N16158
  N16159[Class: names]:::cls
  N16158 --> N16159
  N16160[onerror()]:::mth
  N16159 --> N16160
  N16161[Class: name]:::cls
  N16158 --> N16161
  N16162[onerror()]:::mth
  N16161 --> N16162
  N16163[Class: ExcludedMockTool]:::cls
  N16158 --> N16163
  N16164[onerror()]:::mth
  N16163 --> N16164
  N16165[File: tool-registry.ts]:::file
  N11970 --> N16165
  N16166[Class: DiscoveredToolInvocation]:::cls
  N16165 --> N16166
  N16167[getDescription()]:::mth
  N16166 --> N16167
  N16168[createInvocation()]:::mth
  N16166 --> N16168
  N16169[getMessageBus()]:::mth
  N16166 --> N16169
  N16170[registerTool()]:::mth
  N16166 --> N16170
  N16171[unregisterTool()]:::mth
  N16166 --> N16171
  N16172[Class: DiscoveredTool]:::cls
  N16165 --> N16172
  N16173[getDescription()]:::mth
  N16172 --> N16173
  N16174[createInvocation()]:::mth
  N16172 --> N16174
  N16175[getMessageBus()]:::mth
  N16172 --> N16175
  N16176[registerTool()]:::mth
  N16172 --> N16176
  N16177[unregisterTool()]:::mth
  N16172 --> N16177
  N16178[Class: ToolRegistry]:::cls
  N16165 --> N16178
  N16179[getDescription()]:::mth
  N16178 --> N16179
  N16180[createInvocation()]:::mth
  N16178 --> N16180
  N16181[getMessageBus()]:::mth
  N16178 --> N16181
  N16182[registerTool()]:::mth
  N16178 --> N16182
  N16183[unregisterTool()]:::mth
  N16178 --> N16183
  N16184[File: tools.test.ts]:::file
  N11970 --> N16184
  N16185[Class: TestToolInvocation]:::cls
  N16184 --> N16185
  N16186[getDescription()]:::mth
  N16185 --> N16186
  N16187[toolLocations()]:::mth
  N16185 --> N16187
  N16188[shouldConfirmExecute()]:::mth
  N16185 --> N16188
  N16189[execute()]:::mth
  N16185 --> N16189
  N16190[build()]:::mth
  N16185 --> N16190
  N16191[Class: TestTool]:::cls
  N16184 --> N16191
  N16192[getDescription()]:::mth
  N16191 --> N16192
  N16193[toolLocations()]:::mth
  N16191 --> N16193
  N16194[shouldConfirmExecute()]:::mth
  N16191 --> N16194
  N16195[execute()]:::mth
  N16191 --> N16195
  N16196[build()]:::mth
  N16191 --> N16196
  N16197[File: tools.ts]:::file
  N11970 --> N16197
  N16198[Class: for]:::cls
  N16197 --> N16198
  N16199[getDescription()]:::mth
  N16198 --> N16199
  N16200[getDescription()]:::mth
  N16198 --> N16200
  N16201[shouldConfirmExecute()]:::mth
  N16198 --> N16201
  N16202[getPolicyUpdateOptions()]:::mth
  N16198 --> N16202
  N16203[publishPolicyUpdate()]:::mth
  N16198 --> N16203
  N16204[Class: BaseToolInvocation]:::cls
  N16197 --> N16204
  N16205[getDescription()]:::mth
  N16204 --> N16205
  N16206[getDescription()]:::mth
  N16204 --> N16206
  N16207[shouldConfirmExecute()]:::mth
  N16204 --> N16207
  N16208[getPolicyUpdateOptions()]:::mth
  N16204 --> N16208
  N16209[publishPolicyUpdate()]:::mth
  N16204 --> N16209
  N16210[Class: for]:::cls
  N16197 --> N16210
  N16211[getDescription()]:::mth
  N16210 --> N16211
  N16212[getDescription()]:::mth
  N16210 --> N16212
  N16213[shouldConfirmExecute()]:::mth
  N16210 --> N16213
  N16214[getPolicyUpdateOptions()]:::mth
  N16210 --> N16214
  N16215[publishPolicyUpdate()]:::mth
  N16210 --> N16215
  N16216[Class: DeclarativeTool]:::cls
  N16197 --> N16216
  N16217[getDescription()]:::mth
  N16216 --> N16217
  N16218[getDescription()]:::mth
  N16216 --> N16218
  N16219[shouldConfirmExecute()]:::mth
  N16216 --> N16219
  N16220[getPolicyUpdateOptions()]:::mth
  N16216 --> N16220
  N16221[publishPolicyUpdate()]:::mth
  N16216 --> N16221
  N16222[Class: for]:::cls
  N16197 --> N16222
  N16223[getDescription()]:::mth
  N16222 --> N16223
  N16224[getDescription()]:::mth
  N16222 --> N16224
  N16225[shouldConfirmExecute()]:::mth
  N16222 --> N16225
  N16226[getPolicyUpdateOptions()]:::mth
  N16222 --> N16226
  N16227[publishPolicyUpdate()]:::mth
  N16222 --> N16227
  N16228[Class: BaseDeclarativeTool]:::cls
  N16197 --> N16228
  N16229[getDescription()]:::mth
  N16228 --> N16229
  N16230[getDescription()]:::mth
  N16228 --> N16230
  N16231[shouldConfirmExecute()]:::mth
  N16228 --> N16231
  N16232[getPolicyUpdateOptions()]:::mth
  N16228 --> N16232
  N16233[publishPolicyUpdate()]:::mth
  N16228 --> N16233
  N16235[File: web-fetch.ts]:::file
  N11970 --> N16235
  N16236[Class: WebFetchToolInvocation]:::cls
  N16235 --> N16236
  N16237[parsePrompt()]:::mth
  N16236 --> N16237
  N16238[executeFallback()]:::mth
  N16236 --> N16238
  N16239[getDescription()]:::mth
  N16236 --> N16239
  N16240[getConfirmationDetails()]:::mth
  N16236 --> N16240
  N16241[execute()]:::mth
  N16236 --> N16241
  N16242[Class: WebFetchTool]:::cls
  N16235 --> N16242
  N16243[parsePrompt()]:::mth
  N16242 --> N16243
  N16244[executeFallback()]:::mth
  N16242 --> N16244
  N16245[getDescription()]:::mth
  N16242 --> N16245
  N16246[getConfirmationDetails()]:::mth
  N16242 --> N16246
  N16247[execute()]:::mth
  N16242 --> N16247
  N16249[File: web-search.ts]:::file
  N11970 --> N16249
  N16250[Class: WebSearchToolInvocation]:::cls
  N16249 --> N16250
  N16251[getDescription()]:::mth
  N16250 --> N16251
  N16252[execute()]:::mth
  N16250 --> N16252
  N16253[validateToolParamValues()]:::mth
  N16250 --> N16253
  N16254[createInvocation()]:::mth
  N16250 --> N16254
  N16255[Class: WebSearchTool]:::cls
  N16249 --> N16255
  N16256[getDescription()]:::mth
  N16255 --> N16256
  N16257[execute()]:::mth
  N16255 --> N16257
  N16258[validateToolParamValues()]:::mth
  N16255 --> N16258
  N16259[createInvocation()]:::mth
  N16255 --> N16259
  N16261[File: write-file.ts]:::file
  N11970 --> N16261
  N16262[Class: WriteFileToolInvocation]:::cls
  N16261 --> N16262
  N16263[getCorrectedFileContent()]:::mth
  N16262 --> N16263
  N16264[toolLocations()]:::mth
  N16262 --> N16264
  N16265[getDescription()]:::mth
  N16262 --> N16265
  N16266[getConfirmationDetails()]:::mth
  N16262 --> N16266
  N16267[execute()]:::mth
  N16262 --> N16267
  N16268[Class: WriteFileTool]:::cls
  N16261 --> N16268
  N16269[getCorrectedFileContent()]:::mth
  N16268 --> N16269
  N16270[toolLocations()]:::mth
  N16268 --> N16270
  N16271[getDescription()]:::mth
  N16268 --> N16271
  N16272[getConfirmationDetails()]:::mth
  N16268 --> N16272
  N16273[execute()]:::mth
  N16268 --> N16273
  N16275[File: write-todos.ts]:::file
  N11970 --> N16275
  N16276[Class: WriteTodosToolInvocation]:::cls
  N16275 --> N16276
  N16277[getDescription()]:::mth
  N16276 --> N16277
  N16278[schema()]:::mth
  N16276 --> N16278
  N16279[validateToolParamValues()]:::mth
  N16276 --> N16279
  N16280[createInvocation()]:::mth
  N16276 --> N16280
  N16281[Class: WriteTodosTool]:::cls
  N16275 --> N16281
  N16282[getDescription()]:::mth
  N16281 --> N16282
  N16283[schema()]:::mth
  N16281 --> N16283
  N16284[validateToolParamValues()]:::mth
  N16281 --> N16284
  N16285[createInvocation()]:::mth
  N16281 --> N16285
  N16298[File: debugLogger.ts]:::file
  N11970 --> N16298
  N16299[Class: DebugLogger]:::cls
  N16298 --> N16299
  N16300[writeToFile()]:::mth
  N16299 --> N16300
  N16301[log()]:::mth
  N16299 --> N16301
  N16302[warn()]:::mth
  N16299 --> N16302
  N16303[error()]:::mth
  N16299 --> N16303
  N16304[debug()]:::mth
  N16299 --> N16304
  N16318[File: errors.ts]:::file
  N11970 --> N16318
  N16319[Class: FatalError]:::cls
  N16318 --> N16319
  N16320[isNodeError()]:::mth
  N16319 --> N16320
  N16321[getErrorMessage()]:::mth
  N16319 --> N16321
  N16322[toFriendlyError()]:::mth
  N16319 --> N16322
  N16323[parseResponseData()]:::mth
  N16319 --> N16323
  N16324[isAuthenticationError()]:::mth
  N16319 --> N16324
  N16325[Class: FatalAuthenticationError]:::cls
  N16318 --> N16325
  N16326[isNodeError()]:::mth
  N16325 --> N16326
  N16327[getErrorMessage()]:::mth
  N16325 --> N16327
  N16328[toFriendlyError()]:::mth
  N16325 --> N16328
  N16329[parseResponseData()]:::mth
  N16325 --> N16329
  N16330[isAuthenticationError()]:::mth
  N16325 --> N16330
  N16331[Class: FatalInputError]:::cls
  N16318 --> N16331
  N16332[isNodeError()]:::mth
  N16331 --> N16332
  N16333[getErrorMessage()]:::mth
  N16331 --> N16333
  N16334[toFriendlyError()]:::mth
  N16331 --> N16334
  N16335[parseResponseData()]:::mth
  N16331 --> N16335
  N16336[isAuthenticationError()]:::mth
  N16331 --> N16336
  N16337[Class: FatalSandboxError]:::cls
  N16318 --> N16337
  N16338[isNodeError()]:::mth
  N16337 --> N16338
  N16339[getErrorMessage()]:::mth
  N16337 --> N16339
  N16340[toFriendlyError()]:::mth
  N16337 --> N16340
  N16341[parseResponseData()]:::mth
  N16337 --> N16341
  N16342[isAuthenticationError()]:::mth
  N16337 --> N16342
  N16343[Class: FatalConfigError]:::cls
  N16318 --> N16343
  N16344[isNodeError()]:::mth
  N16343 --> N16344
  N16345[getErrorMessage()]:::mth
  N16343 --> N16345
  N16346[toFriendlyError()]:::mth
  N16343 --> N16346
  N16347[parseResponseData()]:::mth
  N16343 --> N16347
  N16348[isAuthenticationError()]:::mth
  N16343 --> N16348
  N16349[Class: FatalTurnLimitedError]:::cls
  N16318 --> N16349
  N16350[isNodeError()]:::mth
  N16349 --> N16350
  N16351[getErrorMessage()]:::mth
  N16349 --> N16351
  N16352[toFriendlyError()]:::mth
  N16349 --> N16352
  N16353[parseResponseData()]:::mth
  N16349 --> N16353
  N16354[isAuthenticationError()]:::mth
  N16349 --> N16354
  N16355[Class: FatalToolExecutionError]:::cls
  N16318 --> N16355
  N16356[isNodeError()]:::mth
  N16355 --> N16356
  N16357[getErrorMessage()]:::mth
  N16355 --> N16357
  N16358[toFriendlyError()]:::mth
  N16355 --> N16358
  N16359[parseResponseData()]:::mth
  N16355 --> N16359
  N16360[isAuthenticationError()]:::mth
  N16355 --> N16360
  N16361[Class: FatalCancellationError]:::cls
  N16318 --> N16361
  N16362[isNodeError()]:::mth
  N16361 --> N16362
  N16363[getErrorMessage()]:::mth
  N16361 --> N16363
  N16364[toFriendlyError()]:::mth
  N16361 --> N16364
  N16365[parseResponseData()]:::mth
  N16361 --> N16365
  N16366[isAuthenticationError()]:::mth
  N16361 --> N16366
  N16367[Class: CanceledError]:::cls
  N16318 --> N16367
  N16368[isNodeError()]:::mth
  N16367 --> N16368
  N16369[getErrorMessage()]:::mth
  N16367 --> N16369
  N16370[toFriendlyError()]:::mth
  N16367 --> N16370
  N16371[parseResponseData()]:::mth
  N16367 --> N16371
  N16372[isAuthenticationError()]:::mth
  N16367 --> N16372
  N16373[Class: ForbiddenError]:::cls
  N16318 --> N16373
  N16374[isNodeError()]:::mth
  N16373 --> N16374
  N16375[getErrorMessage()]:::mth
  N16373 --> N16375
  N16376[toFriendlyError()]:::mth
  N16373 --> N16376
  N16377[parseResponseData()]:::mth
  N16373 --> N16377
  N16378[isAuthenticationError()]:::mth
  N16373 --> N16378
  N16379[Class: UnauthorizedError]:::cls
  N16318 --> N16379
  N16380[isNodeError()]:::mth
  N16379 --> N16380
  N16381[getErrorMessage()]:::mth
  N16379 --> N16381
  N16382[toFriendlyError()]:::mth
  N16379 --> N16382
  N16383[parseResponseData()]:::mth
  N16379 --> N16383
  N16384[isAuthenticationError()]:::mth
  N16379 --> N16384
  N16385[Class: BadRequestError]:::cls
  N16318 --> N16385
  N16386[isNodeError()]:::mth
  N16385 --> N16386
  N16387[getErrorMessage()]:::mth
  N16385 --> N16387
  N16388[toFriendlyError()]:::mth
  N16385 --> N16388
  N16389[parseResponseData()]:::mth
  N16385 --> N16389
  N16390[isAuthenticationError()]:::mth
  N16385 --> N16390
  N16392[File: events.ts]:::file
  N11970 --> N16392
  N16393[Class: CoreEventEmitter]:::cls
  N16392 --> N16393
  N16394[emitFeedback()]:::mth
  N16393 --> N16394
  N16395[emitConsoleLog()]:::mth
  N16393 --> N16395
  N16396[emitOutput()]:::mth
  N16393 --> N16396
  N16397[emitModelChanged()]:::mth
  N16393 --> N16397
  N16398[emitSettingsChanged()]:::mth
  N16393 --> N16398
  N16400[File: extensionLoader.test.ts]:::file
  N11970 --> N16400
  N16401[Class: TestingSimpleExtensionLoader]:::cls
  N16400 --> N16401
  N16402[startExtension()]:::mth
  N16401 --> N16402
  N16403[stopExtension()]:::mth
  N16401 --> N16403
  N16404[File: extensionLoader.ts]:::file
  N11970 --> N16404
  N16405[Class: ExtensionLoader]:::cls
  N16404 --> N16405
  N16406[getExtensions()]:::mth
  N16405 --> N16406
  N16407[startExtension()]:::mth
  N16405 --> N16407
  N16408[maybeRefreshMemories()]:::mth
  N16405 --> N16408
  N16409[maybeRefreshGeminiTools()]:::mth
  N16405 --> N16409
  N16410[maybeStartExtension()]:::mth
  N16405 --> N16410
  N16411[Class: SimpleExtensionLoader]:::cls
  N16404 --> N16411
  N16412[getExtensions()]:::mth
  N16411 --> N16412
  N16413[startExtension()]:::mth
  N16411 --> N16413
  N16414[maybeRefreshMemories()]:::mth
  N16411 --> N16414
  N16415[maybeRefreshGeminiTools()]:::mth
  N16411 --> N16415
  N16416[maybeStartExtension()]:::mth
  N16411 --> N16416
  N16417[File: fetch.ts]:::file
  N11970 --> N16417
  N16418[Class: FetchError]:::cls
  N16417 --> N16418
  N16419[isPrivateIp()]:::mth
  N16418 --> N16419
  N16420[fetchWithTimeout()]:::mth
  N16418 --> N16420
  N16421[setGlobalProxy()]:::mth
  N16418 --> N16421
  N16431[File: fileSearch.ts]:::file
  N11970 --> N16431
  N16432[Class: AbortError]:::cls
  N16431 --> N16432
  N16433[filter()]:::mth
  N16432 --> N16433
  N16434[initialize()]:::mth
  N16432 --> N16434
  N16435[initialize()]:::mth
  N16432 --> N16435
  N16436[search()]:::mth
  N16432 --> N16436
  N16437[buildResultCache()]:::mth
  N16432 --> N16437
  N16438[Class: RecursiveFileSearch]:::cls
  N16431 --> N16438
  N16439[filter()]:::mth
  N16438 --> N16439
  N16440[initialize()]:::mth
  N16438 --> N16440
  N16441[initialize()]:::mth
  N16438 --> N16441
  N16442[search()]:::mth
  N16438 --> N16442
  N16443[buildResultCache()]:::mth
  N16438 --> N16443
  N16444[Class: DirectoryFileSearch]:::cls
  N16431 --> N16444
  N16445[filter()]:::mth
  N16444 --> N16445
  N16446[initialize()]:::mth
  N16444 --> N16446
  N16447[initialize()]:::mth
  N16444 --> N16447
  N16448[search()]:::mth
  N16444 --> N16448
  N16449[buildResultCache()]:::mth
  N16444 --> N16449
  N16450[Class: FileSearchFactory]:::cls
  N16431 --> N16450
  N16451[filter()]:::mth
  N16450 --> N16451
  N16452[initialize()]:::mth
  N16450 --> N16452
  N16453[initialize()]:::mth
  N16450 --> N16453
  N16454[search()]:::mth
  N16450 --> N16454
  N16455[buildResultCache()]:::mth
  N16450 --> N16455
  N16457[File: ignore.ts]:::file
  N11970 --> N16457
  N16458[Class: Ignore]:::cls
  N16457 --> N16458
  N16459[loadIgnoreRules()]:::mth
  N16458 --> N16459
  N16460[add()]:::mth
  N16458 --> N16460
  N16461[getDirectoryFilter()]:::mth
  N16458 --> N16461
  N16462[getFileFilter()]:::mth
  N16458 --> N16462
  N16463[getFingerprint()]:::mth
  N16458 --> N16463
  N16465[File: result-cache.ts]:::file
  N11970 --> N16465
  N16466[Class: ResultCache]:::cls
  N16465 --> N16466
  N16467[get()]:::mth
  N16466 --> N16467
  N16468[set()]:::mth
  N16466 --> N16468
  N16473[File: geminiIgnoreParser.ts]:::file
  N11970 --> N16473
  N16474[Class: GeminiIgnoreParser]:::cls
  N16473 --> N16474
  N16475[isIgnored()]:::mth
  N16474 --> N16475
  N16476[loadPatterns()]:::mth
  N16474 --> N16476
  N16477[isIgnored()]:::mth
  N16474 --> N16477
  N16478[getPatterns()]:::mth
  N16474 --> N16478
  N16479[getIgnoreFilePath()]:::mth
  N16474 --> N16479
  N16486[File: gitIgnoreParser.ts]:::file
  N11970 --> N16486
  N16487[Class: GitIgnoreParser]:::cls
  N16486 --> N16487
  N16488[isIgnored()]:::mth
  N16487 --> N16488
  N16489[loadPatternsForFile()]:::mth
  N16487 --> N16489
  N16490[processPatterns()]:::mth
  N16487 --> N16490
  N16491[isIgnored()]:::mth
  N16487 --> N16491
  N16496[File: googleQuotaErrors.ts]:::file
  N11970 --> N16496
  N16497[Class: TerminalQuotaError]:::cls
  N16496 --> N16497
  N16498[parseDurationInSeconds()]:::mth
  N16497 --> N16498
  N16499[classifyGoogleError()]:::mth
  N16497 --> N16499
  N16500[Class: RetryableQuotaError]:::cls
  N16496 --> N16500
  N16501[parseDurationInSeconds()]:::mth
  N16500 --> N16501
  N16502[classifyGoogleError()]:::mth
  N16500 --> N16502
  N16503[File: httpErrors.ts]:::file
  N11970 --> N16503
  N16504[Class: ModelNotFoundError]:::cls
  N16503 --> N16504
  N16505[getErrorStatus()]:::mth
  N16504 --> N16505
  N16507[File: ignorePatterns.ts]:::file
  N11970 --> N16507
  N16508[Class: FileExclusions]:::cls
  N16507 --> N16508
  N16509[getCoreIgnorePatterns()]:::mth
  N16508 --> N16509
  N16510[getDefaultExcludePatterns()]:::mth
  N16508 --> N16510
  N16511[getReadManyFilesExcludes()]:::mth
  N16508 --> N16511
  N16512[getGlobExcludes()]:::mth
  N16508 --> N16512
  N16513[buildExcludePatterns()]:::mth
  N16508 --> N16513
  N16515[File: installationManager.ts]:::file
  N11970 --> N16515
  N16516[Class: InstallationManager]:::cls
  N16515 --> N16516
  N16517[getInstallationIdPath()]:::mth
  N16516 --> N16517
  N16518[readInstallationIdFromFile()]:::mth
  N16516 --> N16518
  N16519[writeInstallationIdToFile()]:::mth
  N16516 --> N16519
  N16520[getInstallationId()]:::mth
  N16516 --> N16520
  N16542[File: retry.test.ts]:::file
  N11970 --> N16542
  N16543[Class: NonRetryableError]:::cls
  N16542 --> N16543
  N16548[File: schemaValidator.ts]:::file
  N11970 --> N16548
  N16549[Class: SchemaValidator]:::cls
  N16548 --> N16549
  N16550[validate()]:::mth
  N16549 --> N16550
  N16555[File: shell-utils.ts]:::file
  N11970 --> N16555
  N16556[Class: ShellParserInitializationError]:::cls
  N16555 --> N16556
  N16557[resolveExecutable()]:::mth
  N16556 --> N16557
  N16558[toError()]:::mth
  N16556 --> N16558
  N16559[loadBashLanguage()]:::mth
  N16556 --> N16559
  N16560[initializeShellParsers()]:::mth
  N16556 --> N16560
  N16561[foreach()]:::mth
  N16556 --> N16561
  N16570[File: terminalSerializer.ts]:::file
  N11970 --> N16570
  N16571[Class: Cell]:::cls
  N16570 --> N16571
  N16572[isCursor()]:::mth
  N16571 --> N16572
  N16573[getChars()]:::mth
  N16571 --> N16573
  N16574[isAttribute()]:::mth
  N16571 --> N16574
  N16575[equals()]:::mth
  N16571 --> N16575
  N16576[serializeTerminalToObject()]:::mth
  N16571 --> N16576
  N16584[File: tool-utils.test.ts]:::file
  N11970 --> N16584
  N16585[Class: name]:::cls
  N16584 --> N16585
  N16588[File: userAccountManager.ts]:::file
  N11970 --> N16588
  N16589[Class: UserAccountManager]:::cls
  N16588 --> N16589
  N16590[getGoogleAccountsCachePath()]:::mth
  N16589 --> N16590
  N16591[parseAndValidateAccounts()]:::mth
  N16589 --> N16591
  N16592[readAccountsSync()]:::mth
  N16589 --> N16592
  N16593[readAccounts()]:::mth
  N16589 --> N16593
  N16594[cacheGoogleAccount()]:::mth
  N16589 --> N16594
  N16598[File: workspaceContext.ts]:::file
  N11970 --> N16598
  N16599[Class: WorkspaceContext]:::cls
  N16598 --> N16599
  N16600[notifyDirectoriesChanged()]:::mth
  N16599 --> N16600
  N16601[addDirectory()]:::mth
  N16599 --> N16601
  N16602[resolveAndValidateDir()]:::mth
  N16599 --> N16602
  N16603[getDirectories()]:::mth
  N16599 --> N16603
  N16604[getInitialDirectories()]:::mth
  N16599 --> N16604
  N16610[File: test-rig.ts]:::file
  N11970 --> N16610
  N16611[Class: InteractiveRun]:::cls
  N16610 --> N16611
  N16612[getDefaultTimeout()]:::mth
  N16611 --> N16612
  N16613[sanitizeTestName()]:::mth
  N16611 --> N16613
  N16614[createToolCallErrorMessage()]:::mth
  N16611 --> N16614
  N16615[printDebugInfo()]:::mth
  N16611 --> N16615
  N16616[expectText()]:::mth
  N16611 --> N16616
  N16617[Class: TestRig]:::cls
  N16610 --> N16617
  N16618[getDefaultTimeout()]:::mth
  N16617 --> N16618
  N16619[sanitizeTestName()]:::mth
  N16617 --> N16619
  N16620[createToolCallErrorMessage()]:::mth
  N16617 --> N16620
  N16621[printDebugInfo()]:::mth
  N16617 --> N16621
  N16622[expectText()]:::mth
  N16617 --> N16622
  N16624[File: diff-manager.ts]:::file
  N11970 --> N16624
  N16625[Class: DiffContentProvider]:::cls
  N16624 --> N16625
  N16626[onDidChange()]:::mth
  N16625 --> N16626
  N16627[provideTextDocumentContent()]:::mth
  N16625 --> N16627
  N16628[setContent()]:::mth
  N16625 --> N16628
  N16629[deleteContent()]:::mth
  N16625 --> N16629
  N16630[getContent()]:::mth
  N16625 --> N16630
  N16631[Class: DiffManager]:::cls
  N16624 --> N16631
  N16632[onDidChange()]:::mth
  N16631 --> N16632
  N16633[provideTextDocumentContent()]:::mth
  N16631 --> N16633
  N16634[setContent()]:::mth
  N16631 --> N16634
  N16635[deleteContent()]:::mth
  N16631 --> N16635
  N16636[getContent()]:::mth
  N16631 --> N16636
  N16640[File: ide-server.ts]:::file
  N11970 --> N16640
  N16641[Class: CORSError]:::cls
  N16640 --> N16641
  N16642[writePortAndWorkspace()]:::mth
  N16641 --> N16642
  N16643[start()]:::mth
  N16641 --> N16643
  N16644[broadcastIdeContextUpdate()]:::mth
  N16641 --> N16644
  N16645[syncEnvVars()]:::mth
  N16641 --> N16645
  N16646[stop()]:::mth
  N16641 --> N16646
  N16647[Class: IDEServer]:::cls
  N16640 --> N16647
  N16648[writePortAndWorkspace()]:::mth
  N16647 --> N16648
  N16649[start()]:::mth
  N16647 --> N16649
  N16650[broadcastIdeContextUpdate()]:::mth
  N16647 --> N16650
  N16651[syncEnvVars()]:::mth
  N16647 --> N16651
  N16652[stop()]:::mth
  N16647 --> N16652
  N16654[File: open-files-manager.ts]:::file
  N11970 --> N16654
  N16655[Class: OpenFilesManager]:::cls
  N16654 --> N16655
  N16656[isFileUri()]:::mth
  N16655 --> N16656
  N16657[addOrMoveToFront()]:::mth
  N16655 --> N16657
  N16658[remove()]:::mth
  N16655 --> N16658
  N16659[rename()]:::mth
  N16655 --> N16659
  N16660[updateActiveContext()]:::mth
  N16655 --> N16660
  N16673[frontend]:::pkg
  TNF --> N16673
  N16679[File: workflow.ts]:::file
  N16673 --> N16679
  N16680[Class: WorkflowApiService]:::cls
  N16679 --> N16680
  N16681[toApiError()]:::mth
  N16680 --> N16681
  N16682[getWorkflows()]:::mth
  N16680 --> N16682
  N16683[getWorkflow()]:::mth
  N16680 --> N16683
  N16684[createWorkflow()]:::mth
  N16680 --> N16684
  N16685[updateWorkflow()]:::mth
  N16680 --> N16685
  N16686[File: workspace.ts]:::file
  N16673 --> N16686
  N16687[Class: WorkspaceApiService]:::cls
  N16686 --> N16687
  N16688[toApiError()]:::mth
  N16687 --> N16688
  N16689[getAuthHeaders()]:::mth
  N16687 --> N16689
  N16690[getCurrentWorkspace()]:::mth
  N16687 --> N16690
  N16691[getWorkspaces()]:::mth
  N16687 --> N16691
  N16692[getWorkspace()]:::mth
  N16687 --> N16692
  N16704[File: N8nWorkflowConverter.ts]:::file
  N16673 --> N16704
  N16705[Class: N8nWorkflowConverter]:::cls
  N16704 --> N16705
  N16706[convertToN8n()]:::mth
  N16705 --> N16706
  N16707[convertFromN8n()]:::mth
  N16705 --> N16707
  N16708[convertNodesToN8n()]:::mth
  N16705 --> N16708
  N16709[convertNodesFromN8n()]:::mth
  N16705 --> N16709
  N16710[convertConnectionsToN8n()]:::mth
  N16705 --> N16710
  N16713[File: node-config-builder.ts]:::file
  N16673 --> N16713
  N16714[Class: NodeConfigBuilder]:::cls
  N16713 --> N16714
  N16715[createConfig()]:::mth
  N16714 --> N16715
  N16716[mapParameters()]:::mth
  N16714 --> N16716
  N16717[getDefaultParameters()]:::mth
  N16714 --> N16717
  N16718[validateParameters()]:::mth
  N16714 --> N16718
  N16719[processSpecialNodeTypes()]:::mth
  N16714 --> N16719
  N16721[File: realtime-validation.ts]:::file
  N16673 --> N16721
  N16722[Class: WorkflowValidator]:::cls
  N16721 --> N16722
  N16723[validate()]:::mth
  N16722 --> N16723
  N16727[File: YouTubeTranscriber.ts]:::file
  N16673 --> N16727
  N16728[Class: YouTubeTranscriber]:::cls
  N16727 --> N16728
  N16729[isValidYouTubeUrl()]:::mth
  N16728 --> N16729
  N16730[transcribeVideo()]:::mth
  N16728 --> N16730
  N16731[extractVideoId()]:::mth
  N16728 --> N16731
  N16751[File: index.ts]:::file
  N16673 --> N16751
  N16752[Class: components]:::cls
  N16751 --> N16752
  N16757[File: AdvancedGraphAlgorithms.ts]:::file
  N16673 --> N16757
  N16758[Class: AdvancedGraphAlgorithms]:::cls
  N16757 --> N16758
  N16759[buildAdjacencyMatrix()]:::mth
  N16758 --> N16759
  N16760[buildLaplacianMatrix()]:::mth
  N16758 --> N16760
  N16761[powerIteration()]:::mth
  N16758 --> N16761
  N16762[calculateEigenvectorCentrality()]:::mth
  N16758 --> N16762
  N16763[calculateKatzCentrality()]:::mth
  N16758 --> N16763
  N16764[File: GraphAnalysis.ts]:::file
  N16673 --> N16764
  N16765[Class: GraphAnalyzer]:::cls
  N16764 --> N16765
  N16766[buildAdjacencyMatrix()]:::mth
  N16765 --> N16766
  N16767[calculateDegrees()]:::mth
  N16765 --> N16767
  N16768[calculateBetweennessCentrality()]:::mth
  N16765 --> N16768
  N16769[calculateClosenessCentrality()]:::mth
  N16765 --> N16769
  N16770[calculatePageRank()]:::mth
  N16765 --> N16770
  N16786[File: AuthService.ts]:::file
  N16673 --> N16786
  N16787[Class: AuthService]:::cls
  N16786 --> N16787
  N16788[getInstance()]:::mth
  N16787 --> N16788
  N16789[login()]:::mth
  N16787 --> N16789
  N16790[logout()]:::mth
  N16787 --> N16790
  N16791[register()]:::mth
  N16787 --> N16791
  N16792[refreshToken()]:::mth
  N16787 --> N16792
  N16793[File: ConfigService.ts]:::file
  N16673 --> N16793
  N16794[Class: ConfigService]:::cls
  N16793 --> N16794
  N16795[getInstance()]:::mth
  N16794 --> N16795
  N16796[initialize()]:::mth
  N16794 --> N16796
  N16797[validateConfig()]:::mth
  N16794 --> N16797
  N16798[getConfig()]:::mth
  N16794 --> N16798
  N16799[isFeatureEnabled()]:::mth
  N16794 --> N16799
  N16800[File: ErrorService.ts]:::file
  N16673 --> N16800
  N16801[Class: ErrorService]:::cls
  N16800 --> N16801
  N16802[getInstance()]:::mth
  N16801 --> N16802
  N16803[setupGlobalErrorHandling()]:::mth
  N16801 --> N16803
  N16804[handleError()]:::mth
  N16801 --> N16804
  N16805[shouldReportError()]:::mth
  N16801 --> N16805
  N16806[reportError()]:::mth
  N16801 --> N16806
  N16807[File: client-security.ts]:::file
  N16673 --> N16807
  N16808[Class: ClientSecurityUtils]:::cls
  N16807 --> N16808
  N16809[sanitizeHTML()]:::mth
  N16808 --> N16809
  N16810[sanitizeText()]:::mth
  N16808 --> N16810
  N16811[sanitizeForDatabase()]:::mth
  N16808 --> N16811
  N16812[sanitizeFileName()]:::mth
  N16808 --> N16812
  N16813[sanitizeUrl()]:::mth
  N16808 --> N16813
  N16814[File: formatting.ts]:::file
  N16673 --> N16814
  N16815[Class: DateFormatter]:::cls
  N16814 --> N16815
  N16816[formatDate()]:::mth
  N16815 --> N16816
  N16817[formatRelative()]:::mth
  N16815 --> N16817
  N16818[formatNumber()]:::mth
  N16815 --> N16818
  N16819[formatCurrency()]:::mth
  N16815 --> N16819
  N16820[formatPercentage()]:::mth
  N16815 --> N16820
  N16821[Class: NumberFormatter]:::cls
  N16814 --> N16821
  N16822[formatDate()]:::mth
  N16821 --> N16822
  N16823[formatRelative()]:::mth
  N16821 --> N16823
  N16824[formatNumber()]:::mth
  N16821 --> N16824
  N16825[formatCurrency()]:::mth
  N16821 --> N16825
  N16826[formatPercentage()]:::mth
  N16821 --> N16826
  N16827[Class: StringFormatter]:::cls
  N16814 --> N16827
  N16828[formatDate()]:::mth
  N16827 --> N16828
  N16829[formatRelative()]:::mth
  N16827 --> N16829
  N16830[formatNumber()]:::mth
  N16827 --> N16830
  N16831[formatCurrency()]:::mth
  N16827 --> N16831
  N16832[formatPercentage()]:::mth
  N16827 --> N16832
  N16833[Class: DurationFormatter]:::cls
  N16814 --> N16833
  N16834[formatDate()]:::mth
  N16833 --> N16834
  N16835[formatRelative()]:::mth
  N16833 --> N16835
  N16836[formatNumber()]:::mth
  N16833 --> N16836
  N16837[formatCurrency()]:::mth
  N16833 --> N16837
  N16838[formatPercentage()]:::mth
  N16833 --> N16838
  N16839[File: validation.ts]:::file
  N16673 --> N16839
  N16840[Class: Validator]:::cls
  N16839 --> N16840
  N16841[addRule()]:::mth
  N16840 --> N16841
  N16842[validate()]:::mth
  N16840 --> N16842
  N16850[File: AgentBridge.ts]:::file
  N16673 --> N16850
  N16851[Class: AgentBridge]:::cls
  N16850 --> N16851
  N16852[getInstance()]:::mth
  N16851 --> N16852
  N16853[setupEventListeners()]:::mth
  N16851 --> N16853
  N16854[handleAgentMessage()]:::mth
  N16851 --> N16854
  N16855[handleAgentStatusChange()]:::mth
  N16851 --> N16855
  N16856[sendMessageToAgent()]:::mth
  N16851 --> N16856
  N16857[File: TaskBridge.ts]:::file
  N16673 --> N16857
  N16858[Class: TaskBridge]:::cls
  N16857 --> N16858
  N16859[getInstance()]:::mth
  N16858 --> N16859
  N16860[setupEventListeners()]:::mth
  N16858 --> N16860
  N16861[handleTaskUpdate()]:::mth
  N16858 --> N16861
  N16862[handleStatusChange()]:::mth
  N16858 --> N16862
  N16863[createTask()]:::mth
  N16858 --> N16863
  N16864[File: WorkspaceBridge.ts]:::file
  N16673 --> N16864
  N16865[Class: WorkspaceBridge]:::cls
  N16864 --> N16865
  N16866[getInstance()]:::mth
  N16865 --> N16866
  N16867[setupEventListeners()]:::mth
  N16865 --> N16867
  N16868[handleWorkspaceUpdate()]:::mth
  N16865 --> N16868
  N16869[handleMemberUpdate()]:::mth
  N16865 --> N16869
  N16870[createWorkspace()]:::mth
  N16865 --> N16870
  N16871[File: communication.ts]:::file
  N16673 --> N16871
  N16872[Class: CommunicationManager]:::cls
  N16871 --> N16872
  N16873[getInstance()]:::mth
  N16872 --> N16873
  N16874[connect()]:::mth
  N16872 --> N16874
  N16875[setupWebSocketHandlers()]:::mth
  N16872 --> N16875
  N16876[handleDisconnect()]:::mth
  N16872 --> N16876
  N16877[handleMessage()]:::mth
  N16872 --> N16877
  N16878[File: eventBus.ts]:::file
  N16673 --> N16878
  N16879[Class: EventBus]:::cls
  N16878 --> N16879
  N16880[getInstance()]:::mth
  N16879 --> N16880
  N16881[setupErrorHandling()]:::mth
  N16879 --> N16881
  N16882[emit()]:::mth
  N16879 --> N16882
  N16883[on()]:::mth
  N16879 --> N16883
  N16884[once()]:::mth
  N16879 --> N16884
  N16885[File: messageTypes.ts]:::file
  N16673 --> N16885
  N16886[Class: MessageFactory]:::cls
  N16885 --> N16886
  N16887[createTextMessage()]:::mth
  N16886 --> N16887
  N16888[createCodeMessage()]:::mth
  N16886 --> N16888
  N16889[createImageMessage()]:::mth
  N16886 --> N16889
  N16890[createFileMessage()]:::mth
  N16886 --> N16890
  N16891[createSystemMessage()]:::mth
  N16886 --> N16891
  N16892[File: stateManager.ts]:::file
  N16673 --> N16892
  N16893[Class: StateManager]:::cls
  N16892 --> N16893
  N16894[getInstance()]:::mth
  N16893 --> N16894
  N16895[setState()]:::mth
  N16893 --> N16895
  N16896[getState()]:::mth
  N16893 --> N16896
  N16897[subscribe()]:::mth
  N16893 --> N16897
  N16898[notifySubscribers()]:::mth
  N16893 --> N16898
  N16906[File: useAnalytics.ts]:::file
  N16673 --> N16906
  N16907[Class: ConsoleAnalyticsProvider]:::cls
  N16906 --> N16907
  N16908[trackEvent()]:::mth
  N16907 --> N16908
  N16909[trackPageView()]:::mth
  N16907 --> N16909
  N16910[identifyUser()]:::mth
  N16907 --> N16910
  N16911[reset()]:::mth
  N16907 --> N16911
  N16912[trackEvent()]:::mth
  N16907 --> N16912
  N16913[Class: GA4Provider]:::cls
  N16906 --> N16913
  N16914[trackEvent()]:::mth
  N16913 --> N16914
  N16915[trackPageView()]:::mth
  N16913 --> N16915
  N16916[identifyUser()]:::mth
  N16913 --> N16916
  N16917[reset()]:::mth
  N16913 --> N16917
  N16918[trackEvent()]:::mth
  N16913 --> N16918
  N16919[Class: SegmentProvider]:::cls
  N16906 --> N16919
  N16920[trackEvent()]:::mth
  N16919 --> N16920
  N16921[trackPageView()]:::mth
  N16919 --> N16921
  N16922[identifyUser()]:::mth
  N16919 --> N16922
  N16923[reset()]:::mth
  N16919 --> N16923
  N16924[trackEvent()]:::mth
  N16919 --> N16924
  N16925[Class: CustomAPIProvider]:::cls
  N16906 --> N16925
  N16926[trackEvent()]:::mth
  N16925 --> N16926
  N16927[trackPageView()]:::mth
  N16925 --> N16927
  N16928[identifyUser()]:::mth
  N16925 --> N16928
  N16929[reset()]:::mth
  N16925 --> N16929
  N16930[trackEvent()]:::mth
  N16925 --> N16930
  N16931[Class: MultiProvider]:::cls
  N16906 --> N16931
  N16932[trackEvent()]:::mth
  N16931 --> N16932
  N16933[trackPageView()]:::mth
  N16931 --> N16933
  N16934[identifyUser()]:::mth
  N16931 --> N16934
  N16935[reset()]:::mth
  N16931 --> N16935
  N16936[trackEvent()]:::mth
  N16931 --> N16936
  N16976[File: api_model.ts]:::file
  N16673 --> N16976
  N16977[Class: ApiErrorFactory]:::cls
  N16976 --> N16977
  N16978[create()]:::mth
  N16977 --> N16978
  N16979[File: departments.ts]:::file
  N16673 --> N16979
  N16980[Class: DepartmentUtils]:::cls
  N16979 --> N16980
  N16981[isParentDepartment()]:::mth
  N16980 --> N16981
  N16982[canManageDepartment()]:::mth
  N16980 --> N16982
  N16983[getFullDepartmentPath()]:::mth
  N16980 --> N16983
  N16984[getDepartmentDescendants()]:::mth
  N16980 --> N16984
  N16985[traverse()]:::mth
  N16980 --> N16985
  N16987[File: system.ts]:::file
  N16673 --> N16987
  N16988[Class: System]:::cls
  N16987 --> N16988
  N16989[checkAuth()]:::mth
  N16988 --> N16989
  N16990[getEmbeddingSettings()]:::mth
  N16988 --> N16990
  N16991[updateEmbeddingSettings()]:::mth
  N16988 --> N16991
  N16992[checkEmbeddingProvider()]:::mth
  N16988 --> N16992
  N16993[getModels()]:::mth
  N16988 --> N16993
  N16994[File: task.ts]:::file
  N16673 --> N16994
  N16995[Class: TaskUtils]:::cls
  N16994 --> N16995
  N16996[isOverdue()]:::mth
  N16995 --> N16996
  N16997[calculateProgress()]:::mth
  N16995 --> N16997
  N16998[getPriorityLevel()]:::mth
  N16995 --> N16998
  N16999[calculateTimeSpent()]:::mth
  N16995 --> N16999
  N17000[filterTasks()]:::mth
  N16995 --> N17000
  N17016[File: connect_and_send.ts]:::file
  N16673 --> N17016
  N17017[Class: ConnectionManager]:::cls
  N17016 --> N17017
  N17018[connectAndSend()]:::mth
  N17017 --> N17018
  N17019[waitForConnection()]:::mth
  N17017 --> N17019
  N17020[File: send_introduction.ts]:::file
  N16673 --> N17020
  N17021[Class: IntroductionManager]:::cls
  N17020 --> N17021
  N17022[sendIntroduction()]:::mth
  N17021 --> N17022
  N17023[resendIntroduction()]:::mth
  N17021 --> N17023
  N17024[getStoredCapabilities()]:::mth
  N17021 --> N17024
  N17025[getStoredPreferences()]:::mth
  N17021 --> N17025
  N17026[File: A2AProtocolService.ts]:::file
  N16673 --> N17026
  N17027[Class: A2AProtocolService]:::cls
  N17026 --> N17027
  N17028[createMessage()]:::mth
  N17027 --> N17028
  N17029[createMessageV1()]:::mth
  N17027 --> N17029
  N17030[createMessageV2()]:::mth
  N17027 --> N17030
  N17031[transformMessage()]:::mth
  N17027 --> N17031
  N17032[getMessageVersion()]:::mth
  N17027 --> N17032
  N17033[File: AgentService.ts]:::file
  N16673 --> N17033
  N17034[Class: AgentService]:::cls
  N17033 --> N17034
  N17035[getAgents()]:::mth
  N17034 --> N17035
  N17036[getAgentTemplates()]:::mth
  N17034 --> N17036
  N17037[getAgent()]:::mth
  N17034 --> N17037
  N17038[createAgent()]:::mth
  N17034 --> N17038
  N17039[updateAgent()]:::mth
  N17034 --> N17039
  N17040[File: CascadeBridge.ts]:::file
  N16673 --> N17040
  N17041[Class: CascadeBridge]:::cls
  N17040 --> N17041
  N17042[getInstance()]:::mth
  N17041 --> N17042
  N17043[setupWebSocketListeners()]:::mth
  N17041 --> N17043
  N17044[processMessageQueue()]:::mth
  N17041 --> N17044
  N17045[handleMessage()]:::mth
  N17041 --> N17045
  N17046[send()]:::mth
  N17041 --> N17046
  N17048[File: GeminiNanoService.ts]:::file
  N16673 --> N17048
  N17049[Class: GeminiNanoService]:::cls
  N17048 --> N17049
  N17050[prompt()]:::mth
  N17049 --> N17050
  N17051[capabilities()]:::mth
  N17049 --> N17051
  N17052[getInstance()]:::mth
  N17049 --> N17052
  N17053[checkCapabilities()]:::mth
  N17049 --> N17053
  N17054[initialize()]:::mth
  N17049 --> N17054
  N17056[File: MCPMarketplaceService.ts]:::file
  N16673 --> N17056
  N17057[Class: MCPMarketplaceService]:::cls
  N17056 --> N17057
  N17058[getServers()]:::mth
  N17057 --> N17058
  N17059[searchServers()]:::mth
  N17057 --> N17059
  N17060[getServer()]:::mth
  N17057 --> N17060
  N17061[installServer()]:::mth
  N17057 --> N17061
  N17062[File: MCPService.ts]:::file
  N16673 --> N17062
  N17063[Class: MCPService]:::cls
  N17062 --> N17063
  N17064[getServers()]:::mth
  N17063 --> N17064
  N17065[getServer()]:::mth
  N17063 --> N17065
  N17066[getTools()]:::mth
  N17063 --> N17066
  N17067[getTool()]:::mth
  N17063 --> N17067
  N17068[executeTool()]:::mth
  N17063 --> N17068
  N17071[File: WebSocketService.ts]:::file
  N16673 --> N17071
  N17072[Class: WebSocketService]:::cls
  N17071 --> N17072
  N17073[resolveDefaultSocketUrl()]:::mth
  N17072 --> N17073
  N17074[getInstance()]:::mth
  N17072 --> N17074
  N17075[connect()]:::mth
  N17072 --> N17075
  N17076[disconnect()]:::mth
  N17072 --> N17076
  N17077[on()]:::mth
  N17072 --> N17077
  N17078[File: WorkflowDatabaseService.ts]:::file
  N16673 --> N17078
  N17079[Class: WorkflowDatabaseService]:::cls
  N17078 --> N17079
  N17080[getWorkflows()]:::mth
  N17079 --> N17080
  N17081[Date()]:::mth
  N17079 --> N17081
  N17082[getWorkflow()]:::mth
  N17079 --> N17082
  N17083[Date()]:::mth
  N17079 --> N17083
  N17084[createWorkflow()]:::mth
  N17079 --> N17084
  N17085[File: WorkflowExecutionService.ts]:::file
  N16673 --> N17085
  N17086[Class: WorkflowExecutionService]:::cls
  N17085 --> N17086
  N17087[createWebSocketConnection()]:::mth
  N17086 --> N17087
  N17088[notifySubscribers()]:::mth
  N17086 --> N17088
  N17089[unsubscribe()]:::mth
  N17086 --> N17089
  N17090[getExecutionStatus()]:::mth
  N17086 --> N17090
  N17091[Date()]:::mth
  N17086 --> N17091
  N17092[File: WorkflowService.ts]:::file
  N16673 --> N17092
  N17093[Class: WorkflowService]:::cls
  N17092 --> N17093
  N17094[getWorkflows()]:::mth
  N17093 --> N17094
  N17095[getWorkflow()]:::mth
  N17093 --> N17095
  N17096[createWorkflow()]:::mth
  N17093 --> N17096
  N17097[updateWorkflow()]:::mth
  N17093 --> N17097
  N17098[deleteWorkflow()]:::mth
  N17093 --> N17098
  N17099[File: WorkflowValidationService.ts]:::file
  N16673 --> N17099
  N17100[Class: WorkflowValidationService]:::cls
  N17099 --> N17100
  N17101[validateWorkflow()]:::mth
  N17100 --> N17101
  N17102[validateStructure()]:::mth
  N17100 --> N17102
  N17103[validateNode()]:::mth
  N17100 --> N17103
  N17104[validateAgentNode()]:::mth
  N17100 --> N17104
  N17105[validateMCPToolNode()]:::mth
  N17100 --> N17105
  N17109[File: agent_chat.ts]:::file
  N16673 --> N17109
  N17110[Class: AgentChatService]:::cls
  N17109 --> N17110
  N17111[getInstance()]:::mth
  N17110 --> N17111
  N17112[setupWebSocketListeners()]:::mth
  N17110 --> N17112
  N17113[sendMessage()]:::mth
  N17110 --> N17113
  N17114[getMessageHistory()]:::mth
  N17110 --> N17114
  N17115[clearHistory()]:::mth
  N17110 --> N17115
  N17119[File: auth.ts]:::file
  N16673 --> N17119
  N17120[Class: AuthService]:::cls
  N17119 --> N17120
  N17121[getUserData()]:::mth
  N17120 --> N17121
  N17122[enable2FA()]:::mth
  N17120 --> N17122
  N17123[disable2FA()]:::mth
  N17120 --> N17123
  N17124[File: bookmarks.service.ts]:::file
  N16673 --> N17124
  N17125[Class: BookmarksService]:::cls
  N17124 --> N17125
  N17126[getAllWorkspaceBookmarks()]:::mth
  N17125 --> N17126
  N17127[addWorkspaceBookmark()]:::mth
  N17125 --> N17127
  N17128[updateWorkspaceBookmark()]:::mth
  N17125 --> N17128
  N17129[removeWorkspaceBookmark()]:::mth
  N17125 --> N17129
  N17130[File: chatApi.ts]:::file
  N16673 --> N17130
  N17131[Class: ChatApiService]:::cls
  N17130 --> N17131
  N17132[getChats()]:::mth
  N17131 --> N17132
  N17133[getChat()]:::mth
  N17131 --> N17133
  N17134[createChat()]:::mth
  N17131 --> N17134
  N17135[addMessage()]:::mth
  N17131 --> N17135
  N17136[generateAgentResponse()]:::mth
  N17131 --> N17136
  N17137[File: dashboard.service.ts]:::file
  N16673 --> N17137
  N17138[Class: DashboardService]:::cls
  N17137 --> N17138
  N17139[request()]:::mth
  N17138 --> N17139
  N17140[getDashboardMetrics()]:::mth
  N17138 --> N17140
  N17141[getAdminDashboardMetrics()]:::mth
  N17138 --> N17141
  N17142[File: logging.ts]:::file
  N16673 --> N17142
  N17143[Class: LoggingService]:::cls
  N17142 --> N17143
  N17144[getInstance()]:::mth
  N17143 --> N17144
  N17145[createLogEntry()]:::mth
  N17143 --> N17145
  N17146[addLog()]:::mth
  N17143 --> N17146
  N17147[getConsoleMethod()]:::mth
  N17143 --> N17147
  N17148[debug()]:::mth
  N17143 --> N17148
  N17149[File: marketplace.service.ts]:::file
  N16673 --> N17149
  N17150[Class: MarketplaceService]:::cls
  N17149 --> N17150
  N17151[getCatalog()]:::mth
  N17150 --> N17151
  N17152[getExperiences()]:::mth
  N17150 --> N17152
  N17153[getResearchCounts()]:::mth
  N17150 --> N17153
  N17154[getResearchSources()]:::mth
  N17150 --> N17154
  N17155[getResearchSkillCounts()]:::mth
  N17150 --> N17155
  N17157[File: n8n-metadata.service.ts]:::file
  N16673 --> N17157
  N17158[Class: N8nMetadataService]:::cls
  N17157 --> N17158
  N17159[initializeBuiltInNodes()]:::mth
  N17158 --> N17159
  N17160[getNodeMetadata()]:::mth
  N17158 --> N17160
  N17161[getAllNodeMetadata()]:::mth
  N17158 --> N17161
  N17162[getNodesByCategory()]:::mth
  N17158 --> N17162
  N17163[getCategories()]:::mth
  N17158 --> N17163
  N17165[File: port-management-api.ts]:::file
  N16673 --> N17165
  N17166[Class: PortManagementApi]:::cls
  N17165 --> N17166
  N17167[getAllPorts()]:::mth
  N17166 --> N17167
  N17168[registerPort()]:::mth
  N17166 --> N17168
  N17169[reassignPort()]:::mth
  N17166 --> N17169
  N17170[getConflicts()]:::mth
  N17166 --> N17170
  N17171[resolveConflict()]:::mth
  N17166 --> N17171
  N17172[File: progress_tracker.ts]:::file
  N16673 --> N17172
  N17173[Class: ProgressTracker]:::cls
  N17172 --> N17173
  N17174[getInstance()]:::mth
  N17173 --> N17174
  N17175[startTask()]:::mth
  N17173 --> N17175
  N17176[updateProgress()]:::mth
  N17173 --> N17176
  N17177[completeTask()]:::mth
  N17173 --> N17177
  N17178[failTask()]:::mth
  N17173 --> N17178
  N17180[File: resources.service.ts]:::file
  N16673 --> N17180
  N17181[Class: ResourcesService]:::cls
  N17180 --> N17181
  N17182[buildProtocolRequestEnvelope()]:::mth
  N17181 --> N17182
  N17183[createMessageId()]:::mth
  N17181 --> N17183
  N17184[getAuthHeaders()]:::mth
  N17181 --> N17184
  N17185[mapCategory()]:::mth
  N17181 --> N17185
  N17186[toBaseResource()]:::mth
  N17181 --> N17186
  N17190[File: verification.ts]:::file
  N16673 --> N17190
  N17191[Class: VerificationService]:::cls
  N17190 --> N17191
  N17192[getInstance()]:::mth
  N17191 --> N17192
  N17193[verifyEmail()]:::mth
  N17191 --> N17193
  N17194[resendVerification()]:::mth
  N17191 --> N17194
  N17195[verify2FA()]:::mth
  N17191 --> N17195
  N17196[File: websocket.ts]:::file
  N16673 --> N17196
  N17197[Class: WebSocketService]:::cls
  N17196 --> N17197
  N17198[getWebSocketUrl()]:::mth
  N17197 --> N17198
  N17199[connect()]:::mth
  N17197 --> N17199
  N17200[handleReconnect()]:::mth
  N17197 --> N17200
  N17201[send()]:::mth
  N17197 --> N17201
  N17202[File: workspaceDomains.service.ts]:::file
  N16673 --> N17202
  N17203[Class: WorkspaceDomainsService]:::cls
  N17202 --> N17203
  N17204[getAllWorkspaceDomains()]:::mth
  N17203 --> N17204
  N17205[addDomain()]:::mth
  N17203 --> N17205
  N17206[removeDomain()]:::mth
  N17203 --> N17206
  N17207[verifyDomain()]:::mth
  N17203 --> N17207
  N17239[File: class-validator.ts]:::file
  N16673 --> N17239
  N17240[Class: ValidationError]:::cls
  N17239 --> N17240
  N17242[File: form-data.ts]:::file
  N16673 --> N17242
  N17243[Class: FormDataStub]:::cls
  N17242 --> N17243
  N17244[append()]:::mth
  N17243 --> N17244
  N17245[File: nestjs-common.ts]:::file
  N16673 --> N17245
  N17246[Class: export]:::cls
  N17245 --> N17246
  N17247[verbose()]:::mth
  N17246 --> N17247
  N17248[debug()]:::mth
  N17246 --> N17248
  N17249[log()]:::mth
  N17246 --> N17249
  N17250[warn()]:::mth
  N17246 --> N17250
  N17251[error()]:::mth
  N17246 --> N17251
  N17252[Class: Logger]:::cls
  N17245 --> N17252
  N17253[verbose()]:::mth
  N17252 --> N17253
  N17254[debug()]:::mth
  N17252 --> N17254
  N17255[log()]:::mth
  N17252 --> N17255
  N17256[warn()]:::mth
  N17252 --> N17256
  N17257[error()]:::mth
  N17252 --> N17257
  N17258[File: nestjs-swagger.ts]:::file
  N16673 --> N17258
  N17259[Class: PartialType]:::cls
  N17258 --> N17259
  N17260[setTitle()]:::mth
  N17259 --> N17260
  N17261[setDescription()]:::mth
  N17259 --> N17261
  N17262[setVersion()]:::mth
  N17259 --> N17262
  N17263[addTag()]:::mth
  N17259 --> N17263
  N17264[addBearerAuth()]:::mth
  N17259 --> N17264
  N17265[Class: PickType]:::cls
  N17258 --> N17265
  N17266[setTitle()]:::mth
  N17265 --> N17266
  N17267[setDescription()]:::mth
  N17265 --> N17267
  N17268[setVersion()]:::mth
  N17265 --> N17268
  N17269[addTag()]:::mth
  N17265 --> N17269
  N17270[addBearerAuth()]:::mth
  N17265 --> N17270
  N17271[Class: OmitType]:::cls
  N17258 --> N17271
  N17272[setTitle()]:::mth
  N17271 --> N17272
  N17273[setDescription()]:::mth
  N17271 --> N17273
  N17274[setVersion()]:::mth
  N17271 --> N17274
  N17275[addTag()]:::mth
  N17271 --> N17275
  N17276[addBearerAuth()]:::mth
  N17271 --> N17276
  N17277[Class: IntersectionType]:::cls
  N17258 --> N17277
  N17278[setTitle()]:::mth
  N17277 --> N17278
  N17279[setDescription()]:::mth
  N17277 --> N17279
  N17280[setVersion()]:::mth
  N17277 --> N17280
  N17281[addTag()]:::mth
  N17277 --> N17281
  N17282[addBearerAuth()]:::mth
  N17277 --> N17282
  N17283[Class: DocumentBuilder]:::cls
  N17258 --> N17283
  N17284[setTitle()]:::mth
  N17283 --> N17284
  N17285[setDescription()]:::mth
  N17283 --> N17285
  N17286[setVersion()]:::mth
  N17283 --> N17286
  N17287[addTag()]:::mth
  N17283 --> N17287
  N17288[addBearerAuth()]:::mth
  N17283 --> N17288
  N17289[Class: SwaggerModule]:::cls
  N17258 --> N17289
  N17290[setTitle()]:::mth
  N17289 --> N17290
  N17291[setDescription()]:::mth
  N17289 --> N17291
  N17292[setVersion()]:::mth
  N17289 --> N17292
  N17293[addTag()]:::mth
  N17289 --> N17293
  N17294[addBearerAuth()]:::mth
  N17289 --> N17294
  N17295[File: utils-shim.ts]:::file
  N16673 --> N17295
  N17296[Class: CustomLogger]:::cls
  N17295 --> N17296
  N17297[createLogger()]:::mth
  N17296 --> N17297
  N17298[info()]:::mth
  N17296 --> N17298
  N17299[warn()]:::mth
  N17296 --> N17299
  N17300[error()]:::mth
  N17296 --> N17300
  N17301[debug()]:::mth
  N17296 --> N17301
  N17302[File: winston.ts]:::file
  N16673 --> N17302
  N17303[Class: Console]:::cls
  N17302 --> N17303
  N17304[add()]:::mth
  N17303 --> N17304
  N17305[get()]:::mth
  N17303 --> N17305
  N17306[has()]:::mth
  N17303 --> N17306
  N17307[Class: File]:::cls
  N17302 --> N17307
  N17308[add()]:::mth
  N17307 --> N17308
  N17309[get()]:::mth
  N17307 --> N17309
  N17310[has()]:::mth
  N17307 --> N17310
  N17311[Class: Stream]:::cls
  N17302 --> N17311
  N17312[add()]:::mth
  N17311 --> N17312
  N17313[get()]:::mth
  N17311 --> N17313
  N17314[has()]:::mth
  N17311 --> N17314
  N17315[Class: DailyRotateFile]:::cls
  N17302 --> N17315
  N17316[add()]:::mth
  N17315 --> N17316
  N17317[get()]:::mth
  N17315 --> N17317
  N17318[has()]:::mth
  N17315 --> N17318
  N17319[Class: Logger]:::cls
  N17302 --> N17319
  N17320[add()]:::mth
  N17319 --> N17320
  N17321[get()]:::mth
  N17319 --> N17321
  N17322[has()]:::mth
  N17319 --> N17322
  N17323[Class: Container]:::cls
  N17302 --> N17323
  N17324[add()]:::mth
  N17323 --> N17324
  N17325[get()]:::mth
  N17323 --> N17325
  N17326[has()]:::mth
  N17323 --> N17326
  N17327[File: xmlhttprequest-ssl.ts]:::file
  N16673 --> N17327
  N17328[Class: MissingXMLHttpRequest]:::cls
  N17327 --> N17328
  N17354[File: TimeStamp.ts]:::file
  N16673 --> N17354
  N17355[Class: for]:::cls
  N17354 --> N17355
  N17356[getDate()]:::mth
  N17355 --> N17356
  N17357[getTime()]:::mth
  N17355 --> N17357
  N17358[now()]:::mth
  N17355 --> N17358
  N17359[fromISOString()]:::mth
  N17355 --> N17359
  N17360[format()]:::mth
  N17355 --> N17360
  N17361[Class: TimeStamp]:::cls
  N17354 --> N17361
  N17362[getDate()]:::mth
  N17361 --> N17362
  N17363[getTime()]:::mth
  N17361 --> N17363
  N17364[now()]:::mth
  N17361 --> N17364
  N17365[fromISOString()]:::mth
  N17361 --> N17365
  N17366[format()]:::mth
  N17361 --> N17366
  N17368[File: auth.ts]:::file
  N16673 --> N17368
  N17369[Class: AuthenticationError]:::cls
  N17368 --> N17369
  N17370[registerUser()]:::mth
  N17369 --> N17370
  N17371[loginUser()]:::mth
  N17369 --> N17371
  N17372[verifyToken()]:::mth
  N17369 --> N17372
  N17373[Class: AuthManagerImpl]:::cls
  N17368 --> N17373
  N17374[registerUser()]:::mth
  N17373 --> N17374
  N17375[loginUser()]:::mth
  N17373 --> N17375
  N17376[verifyToken()]:::mth
  N17373 --> N17376
  N17383[File: dynamicImport.ts]:::file
  N16673 --> N17383
  N17384[Class: DynamicImportManager]:::cls
  N17383 --> N17384
  N17385[getImportStats()]:::mth
  N17384 --> N17385
  N17386[clearCache()]:::mth
  N17384 --> N17386
  N17387[File: encryption.ts]:::file
  N16673 --> N17387
  N17388[Class: MessageEncryption]:::cls
  N17387 --> N17388
  N17389[encrypt()]:::mth
  N17388 --> N17389
  N17390[decrypt()]:::mth
  N17388 --> N17390
  N17391[generateKey()]:::mth
  N17388 --> N17391
  N17392[createRoomKey()]:::mth
  N17388 --> N17392
  N17393[initialize()]:::mth
  N17388 --> N17393
  N17394[Class: E2EEncryption]:::cls
  N17387 --> N17394
  N17395[encrypt()]:::mth
  N17394 --> N17395
  N17396[decrypt()]:::mth
  N17394 --> N17396
  N17397[generateKey()]:::mth
  N17394 --> N17397
  N17398[createRoomKey()]:::mth
  N17394 --> N17398
  N17399[initialize()]:::mth
  N17394 --> N17399
  N17400[File: enhanced_communication.ts]:::file
  N16673 --> N17400
  N17401[Class: EnhancedCommunicationBus]:::cls
  N17400 --> N17401
  N17402[publish()]:::mth
  N17401 --> N17402
  N17403[attemptPublish()]:::mth
  N17401 --> N17403
  N17404[handlePublicationTimeout()]:::mth
  N17401 --> N17404
  N17405[generateId()]:::mth
  N17401 --> N17405
  N17406[emit()]:::mth
  N17401 --> N17406
  N17408[File: harmlessness.ts]:::file
  N16673 --> N17408
  N17409[Class: HarmlessnessScreen]:::cls
  N17408 --> N17409
  N17410[screen()]:::mth
  N17409 --> N17410
  N17411[findMatches()]:::mth
  N17409 --> N17411
  N17413[File: logger.ts]:::file
  N16673 --> N17413
  N17414[Class: Logger]:::cls
  N17413 --> N17414
  N17415[simpleHash()]:::mth
  N17414 --> N17415
  N17416[debug()]:::mth
  N17414 --> N17416
  N17417[info()]:::mth
  N17414 --> N17417
  N17418[warn()]:::mth
  N17414 --> N17418
  N17419[error()]:::mth
  N17414 --> N17419
  N17421[File: mcp_integration.ts]:::file
  N16673 --> N17421
  N17422[Class: MCPWorkflowAdapter]:::cls
  N17421 --> N17422
  N17423[registerMcpTools()]:::mth
  N17422 --> N17423
  N17424[registerAgent()]:::mth
  N17422 --> N17424
  N17425[handleToolUse()]:::mth
  N17422 --> N17425
  N17426[processMessage()]:::mth
  N17422 --> N17426
  N17427[generateResponse()]:::mth
  N17422 --> N17427
  N17429[File: messages.ts]:::file
  N16673 --> N17429
  N17430[Class: MessageThread]:::cls
  N17429 --> N17430
  N17431[addMessage()]:::mth
  N17430 --> N17431
  N17432[getMessages()]:::mth
  N17430 --> N17432
  N17433[clear()]:::mth
  N17430 --> N17433
  N17434[createMessage()]:::mth
  N17430 --> N17434
  N17435[createTool()]:::mth
  N17430 --> N17435
  N17436[Class: MessageBuilder]:::cls
  N17429 --> N17436
  N17437[addMessage()]:::mth
  N17436 --> N17437
  N17438[getMessages()]:::mth
  N17436 --> N17438
  N17439[clear()]:::mth
  N17436 --> N17439
  N17440[createMessage()]:::mth
  N17436 --> N17440
  N17441[createTool()]:::mth
  N17436 --> N17441
  N17442[File: monitoring.ts]:::file
  N16673 --> N17442
  N17443[Class: SystemMonitor]:::cls
  N17442 --> N17443
  N17444[recordResponseTime()]:::mth
  N17443 --> N17444
  N17445[recordMessage()]:::mth
  N17443 --> N17445
  N17446[recordToolUsage()]:::mth
  N17443 --> N17446
  N17447[recordError()]:::mth
  N17443 --> N17447
  N17448[updateAgentLoad()]:::mth
  N17443 --> N17448
  N17452[File: performance-monitor.ts]:::file
  N16673 --> N17452
  N17453[Class: PerformanceMonitor]:::cls
  N17452 --> N17453
  N17454[initializeObservers()]:::mth
  N17453 --> N17454
  N17455[recordMetric()]:::mth
  N17453 --> N17455
  N17456[startTiming()]:::mth
  N17453 --> N17456
  N17457[endTiming()]:::mth
  N17453 --> N17457
  N17458[trackComponentRender()]:::mth
  N17453 --> N17458
  N17459[File: performanceMonitor.ts]:::file
  N16673 --> N17459
  N17460[Class: PerformanceMonitor]:::cls
  N17459 --> N17460
  N17461[initializeObserver()]:::mth
  N17460 --> N17461
  N17462[determineChunkType()]:::mth
  N17460 --> N17462
  N17463[startComponentLoad()]:::mth
  N17460 --> N17463
  N17464[startRouteLoad()]:::mth
  N17460 --> N17464
  N17465[recordBundleSize()]:::mth
  N17460 --> N17465
  N17466[File: progress_tracker.ts]:::file
  N16673 --> N17466
  N17467[Class: ProgressTracker]:::cls
  N17466 --> N17467
  N17468[monitorTask()]:::mth
  N17467 --> N17468
  N17469[updateMetrics()]:::mth
  N17467 --> N17469
  N17470[optimizeExecution()]:::mth
  N17467 --> N17470
  N17471[getTaskStatus()]:::mth
  N17467 --> N17471
  N17472[shouldAdjustStrategy()]:::mth
  N17467 --> N17472
  N17473[File: redis_client.ts]:::file
  N16673 --> N17473
  N17474[Class: RedisConfig]:::cls
  N17473 --> N17474
  N17475[toConnectionOptions()]:::mth
  N17474 --> N17475
  N17476[isConnected()]:::mth
  N17474 --> N17476
  N17477[shouldRun()]:::mth
  N17474 --> N17477
  N17478[getRedis()]:::mth
  N17474 --> N17478
  N17479[getSubscriber()]:::mth
  N17474 --> N17479
  N17480[Class: ClientBridge]:::cls
  N17473 --> N17480
  N17481[toConnectionOptions()]:::mth
  N17480 --> N17481
  N17482[isConnected()]:::mth
  N17480 --> N17482
  N17483[shouldRun()]:::mth
  N17480 --> N17483
  N17484[getRedis()]:::mth
  N17480 --> N17484
  N17485[getSubscriber()]:::mth
  N17480 --> N17485
  N17486[File: resource_manager.ts]:::file
  N16673 --> N17486
  N17487[Class: ResourceManager]:::cls
  N17486 --> N17487
  N17488[getDefaultLimits()]:::mth
  N17487 --> N17488
  N17489[initializeUsage()]:::mth
  N17487 --> N17489
  N17490[setLimits()]:::mth
  N17487 --> N17490
  N17491[estimateCost()]:::mth
  N17487 --> N17491
  N17492[checkContextFit()]:::mth
  N17487 --> N17492
  N17494[File: schema_migration.ts]:::file
  N16673 --> N17494
  N17495[Class: SchemaMigration]:::cls
  N17494 --> N17495
  N17496[initialize()]:::mth
  N17495 --> N17496
  N17497[registerMigration()]:::mth
  N17495 --> N17497
  N17498[migrateSchema()]:::mth
  N17495 --> N17498
  N17499[getVersionKey()]:::mth
  N17495 --> N17499
  N17500[findMigrationPath()]:::mth
  N17495 --> N17500
  N17502[File: theme.ts]:::file
  N16673 --> N17502
  N17503[Class: on]:::cls
  N17502 --> N17503
  N17504[getSystemTheme()]:::mth
  N17503 --> N17504
  N17505[getStoredTheme()]:::mth
  N17503 --> N17505
  N17506[setTheme()]:::mth
  N17503 --> N17506
  N17507[applyTheme()]:::mth
  N17503 --> N17507
  N17508[getSystemTheme()]:::mth
  N17503 --> N17508
  N17512[File: verification.ts]:::file
  N16673 --> N17512
  N17513[Class: OutputVerifier]:::cls
  N17512 --> N17513
  N17514[verifySchema()]:::mth
  N17513 --> N17514
  N17515[verifyContent()]:::mth
  N17513 --> N17515
  N17516[verifySecurity()]:::mth
  N17513 --> N17516
  N17517[verifyHarmlessness()]:::mth
  N17513 --> N17517
  N17518[verifyAll()]:::mth
  N17513 --> N17518
  N17524[File: workflow_agent.ts]:::file
  N16673 --> N17524
  N17525[Class: BaseWorkflowAgent]:::cls
  N17524 --> N17525
  N17526[start()]:::mth
  N17525 --> N17526
  N17527[stop()]:::mth
  N17525 --> N17527
  N17528[Class: WorkflowAgentError]:::cls
  N17524 --> N17528
  N17529[start()]:::mth
  N17528 --> N17529
  N17530[stop()]:::mth
  N17528 --> N17530
  N17531[File: workflow_manager.ts]:::file
  N16673 --> N17531
  N17532[Class: WorkflowManager]:::cls
  N17531 --> N17532
  N17533[createWorkflow()]:::mth
  N17532 --> N17533
  N17534[cancelWorkflow()]:::mth
  N17532 --> N17534
  N17535[getWorkflowStatus()]:::mth
  N17532 --> N17535
  N17536[registerTemplate()]:::mth
  N17532 --> N17536
  N17537[generateWorkflowId()]:::mth
  N17532 --> N17537
  N17538[File: workspace.ts]:::file
  N16673 --> N17538
  N17539[Class: Workspace]:::cls
  N17538 --> N17539
  N17540[create()]:::mth
  N17539 --> N17540
  N17541[get()]:::mth
  N17539 --> N17541
  N17542[update()]:::mth
  N17539 --> N17542
  N17543[delete()]:::mth
  N17539 --> N17543
  N17544[File: tailwind.config.ts]:::file
  N16673 --> N17544
  N17545[Class: typography]:::cls
  N17544 --> N17545
  N17549[gemini-bridge-extension]:::pkg
  TNF --> N17549
  N17550[File: BaseAgent.ts]:::file
  N17549 --> N17550
  N17551[Class: BaseAgent]:::cls
  N17550 --> N17551
  N17552[process()]:::mth
  N17551 --> N17552
  N17553[store()]:::mth
  N17551 --> N17553
  N17554[retrieve()]:::mth
  N17551 --> N17554
  N17555[update()]:::mth
  N17551 --> N17555
  N17556[handleMessage()]:::mth
  N17551 --> N17556
  N17558[File: unstoppable-domains-auth.ts]:::file
  N17549 --> N17558
  N17559[Class: UnstoppableDomainsAuth]:::cls
  N17558 --> N17559
  N17560[loadConfig()]:::mth
  N17559 --> N17560
  N17561[loadSession()]:::mth
  N17559 --> N17561
  N17562[saveSession()]:::mth
  N17559 --> N17562
  N17563[configure()]:::mth
  N17559 --> N17563
  N17564[isAuthenticated()]:::mth
  N17559 --> N17564
  N17565[File: auth-manager.ts]:::file
  N17549 --> N17565
  N17566[Class: AuthManager]:::cls
  N17565 --> N17566
  N17567[initialize()]:::mth
  N17566 --> N17567
  N17568[loadTokens()]:::mth
  N17566 --> N17568
  N17569[Date()]:::mth
  N17566 --> N17569
  N17570[saveTokens()]:::mth
  N17566 --> N17570
  N17571[isTokenValid()]:::mth
  N17566 --> N17571
  N17572[File: background.ts]:::file
  N17549 --> N17572
  N17573[Class: HybridBackground]:::cls
  N17572 --> N17573
  N17574[getInstance()]:::mth
  N17573 --> N17574
  N17575[init()]:::mth
  N17573 --> N17575
  N17576[connectToTnf()]:::mth
  N17573 --> N17576
  N17577[connectToMcp()]:::mth
  N17573 --> N17577
  N17578[scheduleReconnect()]:::mth
  N17573 --> N17578
  N17579[File: browser-control-handler.ts]:::file
  N17549 --> N17579
  N17580[Class: BrowserControlHandler]:::cls
  N17579 --> N17580
  N17581[handleMessage()]:::mth
  N17580 --> N17581
  N17582[handleNavigate()]:::mth
  N17580 --> N17582
  N17583[listener()]:::mth
  N17580 --> N17583
  N17584[listener()]:::mth
  N17580 --> N17584
  N17585[handleGoBack()]:::mth
  N17580 --> N17585
  N17586[File: connection-manager.ts]:::file
  N17549 --> N17586
  N17587[Class: ConnectionManager]:::cls
  N17586 --> N17587
  N17588[initialize()]:::mth
  N17587 --> N17588
  N17589[loadSettings()]:::mth
  N17587 --> N17589
  N17590[saveSettings()]:::mth
  N17587 --> N17590
  N17591[connect()]:::mth
  N17587 --> N17591
  N17592[disconnect()]:::mth
  N17587 --> N17592
  N17594[File: message-handler.ts]:::file
  N17549 --> N17594
  N17595[Class: MessageHandler]:::cls
  N17594 --> N17595
  N17596[initialize()]:::mth
  N17595 --> N17596
  N17597[showNotification()]:::mth
  N17595 --> N17597
  N17598[File: screen-recording.ts]:::file
  N17549 --> N17598
  N17599[Class: ScreenRecordingService]:::cls
  N17598 --> N17599
  N17600[startRecording()]:::mth
  N17599 --> N17600
  N17601[stopRecording()]:::mth
  N17599 --> N17601
  N17602[isCurrentlyRecording()]:::mth
  N17599 --> N17602
  N17603[getStatus()]:::mth
  N17599 --> N17603
  N17604[captureTab()]:::mth
  N17599 --> N17604
  N17605[File: web3-interceptor.ts]:::file
  N17549 --> N17605
  N17606[Class: Web3Interceptor]:::cls
  N17605 --> N17606
  N17607[loadConfig()]:::mth
  N17606 --> N17607
  N17608[saveConfig()]:::mth
  N17606 --> N17608
  N17609[setEnabled()]:::mth
  N17606 --> N17609
  N17610[isEnabled()]:::mth
  N17606 --> N17610
  N17611[getConfig()]:::mth
  N17606 --> N17611
  N17612[File: background.ts]:::file
  N17549 --> N17612
  N17613[Class: TNFRelayConnection]:::cls
  N17612 --> N17613
  N17614[connect()]:::mth
  N17613 --> N17614
  N17615[getRelayConfig()]:::mth
  N17613 --> N17615
  N17616[attemptReconnect()]:::mth
  N17613 --> N17616
  N17617[sendRelayMessage()]:::mth
  N17613 --> N17617
  N17618[handleRelayMessage()]:::mth
  N17613 --> N17618
  N17620[File: ai-element-detector.ts]:::file
  N17549 --> N17620
  N17621[Class: AIElementDetector]:::cls
  N17620 --> N17621
  N17622[initializeChatPatterns()]:::mth
  N17621 --> N17622
  N17623[detectChatElements()]:::mth
  N17621 --> N17623
  N17624[findElementsByPattern()]:::mth
  N17621 --> N17624
  N17625[searchByTextPatterns()]:::mth
  N17621 --> N17625
  N17626[isRelevantTagForPattern()]:::mth
  N17621 --> N17626
  N17627[Class: combinations]:::cls
  N17620 --> N17627
  N17628[initializeChatPatterns()]:::mth
  N17627 --> N17628
  N17629[detectChatElements()]:::mth
  N17627 --> N17629
  N17630[findElementsByPattern()]:::mth
  N17627 --> N17630
  N17631[searchByTextPatterns()]:::mth
  N17627 --> N17631
  N17632[isRelevantTagForPattern()]:::mth
  N17627 --> N17632
  N17633[File: browser-control-handlers.ts]:::file
  N17549 --> N17633
  N17634[Class: BrowserControlContentHandlers]:::cls
  N17633 --> N17634
  N17635[detectPlatform()]:::mth
  N17634 --> N17635
  N17636[findElement()]:::mth
  N17634 --> N17636
  N17637[isVisible()]:::mth
  N17634 --> N17637
  N17638[getXPath()]:::mth
  N17634 --> N17638
  N17639[generateSelector()]:::mth
  N17634 --> N17639
  N17640[File: chat-integration-manager.ts]:::file
  N17549 --> N17640
  N17641[Class: ChatIntegrationManager]:::cls
  N17640 --> N17641
  N17642[initializePlatforms()]:::mth
  N17641 --> N17642
  N17643[initializeForCurrentPage()]:::mth
  N17641 --> N17643
  N17644[detectPlatform()]:::mth
  N17641 --> N17644
  N17645[initializeGenericChat()]:::mth
  N17641 --> N17645
  N17646[initializePlatformSpecific()]:::mth
  N17641 --> N17646
  N17647[File: element-selector.ts]:::file
  N17549 --> N17647
  N17648[Class: ElementSelector]:::cls
  N17647 --> N17648
  N17649[exitSelectionMode()]:::mth
  N17648 --> N17649
  N17650[getElementInfo()]:::mth
  N17648 --> N17650
  N17651[autoDetectChatElements()]:::mth
  N17648 --> N17651
  N17652[saveElementMapping()]:::mth
  N17648 --> N17652
  N17653[loadElementMapping()]:::mth
  N17648 --> N17653
  N17655[File: syntax-highlighter.ts]:::file
  N17549 --> N17655
  N17656[Class: if]:::cls
  N17655 --> N17656
  N17657[applySyntaxHighlighting()]:::mth
  N17656 --> N17657
  N17658[setupDarkModeSupport()]:::mth
  N17656 --> N17658
  N17659[updateTheme()]:::mth
  N17656 --> N17659
  N17661[File: logs-viewer.ts]:::file
  N17549 --> N17661
  N17662[Class: LogsViewer]:::cls
  N17661 --> N17662
  N17663[initialize()]:::mth
  N17662 --> N17663
  N17664[refreshLogs()]:::mth
  N17662 --> N17664
  N17665[filterLogs()]:::mth
  N17662 --> N17665
  N17666[updateLogsDisplay()]:::mth
  N17662 --> N17666
  N17667[clearLogs()]:::mth
  N17662 --> N17667
  N17668[File: settings-manager.ts]:::file
  N17549 --> N17668
  N17669[Class: DebugSettingsManager]:::cls
  N17668 --> N17669
  N17670[initialize()]:::mth
  N17669 --> N17670
  N17671[loadSettings()]:::mth
  N17669 --> N17671
  N17672[saveSettings()]:::mth
  N17669 --> N17672
  N17673[resetSettings()]:::mth
  N17669 --> N17673
  N17674[updateUI()]:::mth
  N17669 --> N17674
  N17675[File: websocket-tester.ts]:::file
  N17549 --> N17675
  N17676[Class: WebSocketTester]:::cls
  N17675 --> N17676
  N17677[connect()]:::mth
  N17676 --> N17677
  N17678[disconnect()]:::mth
  N17676 --> N17678
  N17679[send()]:::mth
  N17676 --> N17679
  N17680[logMessage()]:::mth
  N17676 --> N17680
  N17681[updateUI()]:::mth
  N17676 --> N17681
  N17682[File: FederationManager.ts]:::file
  N17549 --> N17682
  N17683[Class: FederationManager]:::cls
  N17682 --> N17683
  N17684[initialize()]:::mth
  N17683 --> N17684
  N17685[connectToRelay()]:::mth
  N17683 --> N17685
  N17686[registerWithRelay()]:::mth
  N17683 --> N17686
  N17687[handleRelayMessage()]:::mth
  N17683 --> N17687
  N17688[sendToRelay()]:::mth
  N17683 --> N17688
  N17689[File: RedisBridge.ts]:::file
  N17549 --> N17689
  N17690[Class: RedisBridge]:::cls
  N17689 --> N17690
  N17691[connect()]:::mth
  N17690 --> N17691
  N17692[disconnect()]:::mth
  N17690 --> N17692
  N17693[isConnectedToBridge()]:::mth
  N17690 --> N17693
  N17694[register()]:::mth
  N17690 --> N17694
  N17695[startHeartbeat()]:::mth
  N17690 --> N17695
  N17698[File: accessibility.ts]:::file
  N17549 --> N17698
  N17699[Class: AccessibilityManager]:::cls
  N17698 --> N17699
  N17700[loadSettings()]:::mth
  N17699 --> N17700
  N17701[saveSettings()]:::mth
  N17699 --> N17701
  N17702[detectSystemPreferences()]:::mth
  N17699 --> N17702
  N17703[setupSystemPreferenceListeners()]:::mth
  N17699 --> N17703
  N17704[applySettings()]:::mth
  N17699 --> N17704
  N17705[Class: to]:::cls
  N17698 --> N17705
  N17706[loadSettings()]:::mth
  N17705 --> N17706
  N17707[saveSettings()]:::mth
  N17705 --> N17707
  N17708[detectSystemPreferences()]:::mth
  N17705 --> N17708
  N17709[setupSystemPreferenceListeners()]:::mth
  N17705 --> N17709
  N17710[applySettings()]:::mth
  N17705 --> N17710
  N17711[Class: when]:::cls
  N17698 --> N17711
  N17712[loadSettings()]:::mth
  N17711 --> N17712
  N17713[saveSettings()]:::mth
  N17711 --> N17713
  N17714[detectSystemPreferences()]:::mth
  N17711 --> N17714
  N17715[setupSystemPreferenceListeners()]:::mth
  N17711 --> N17715
  N17716[applySettings()]:::mth
  N17711 --> N17716
  N17717[File: chat-manager.ts]:::file
  N17549 --> N17717
  N17718[Class: ChatManager]:::cls
  N17717 --> N17718
  N17719[initialize()]:::mth
  N17718 --> N17719
  N17720[loadMessages()]:::mth
  N17718 --> N17720
  N17721[saveMessages()]:::mth
  N17718 --> N17721
  N17722[sendMessage()]:::mth
  N17718 --> N17722
  N17723[addMessage()]:::mth
  N17718 --> N17723
  N17724[File: AgentNetworkPanel.ts]:::file
  N17549 --> N17724
  N17725[Class: AgentNetworkPanel]:::cls
  N17724 --> N17725
  N17726[setupListeners()]:::mth
  N17725 --> N17726
  N17727[connect()]:::mth
  N17725 --> N17727
  N17728[disconnect()]:::mth
  N17725 --> N17728
  N17729[sendMessage()]:::mth
  N17725 --> N17729
  N17730[render()]:::mth
  N17725 --> N17730
  N17731[File: connection-status.ts]:::file
  N17549 --> N17731
  N17732[Class: ConnectionStatusManager]:::cls
  N17731 --> N17732
  N17733[getConnectionState()]:::mth
  N17732 --> N17733
  N17734[updateStatus()]:::mth
  N17732 --> N17734
  N17735[updateUI()]:::mth
  N17732 --> N17735
  N17736[connect()]:::mth
  N17732 --> N17736
  N17737[disconnect()]:::mth
  N17732 --> N17737
  N17738[File: element-selection-manager.ts]:::file
  N17549 --> N17738
  N17739[Class: ElementSelectionManager]:::cls
  N17738 --> N17739
  N17740[initialize()]:::mth
  N17739 --> N17740
  N17741[updateLastActivity()]:::mth
  N17739 --> N17741
  N17742[enhancedLog()]:::mth
  N17739 --> N17742
  N17743[performEnhancedPlatformDetection()]:::mth
  N17739 --> N17743
  N17744[detectPlatformFromURL()]:::mth
  N17739 --> N17744
  N17745[File: header-connection.ts]:::file
  N17549 --> N17745
  N17746[Class: HeaderConnectionManager]:::cls
  N17745 --> N17746
  N17747[initialize()]:::mth
  N17746 --> N17747
  N17748[updateConnectionStatus()]:::mth
  N17746 --> N17748
  N17749[setConnectingState()]:::mth
  N17746 --> N17749
  N17752[File: tab-manager.ts]:::file
  N17549 --> N17752
  N17753[Class: TabManager]:::cls
  N17752 --> N17753
  N17754[initialize()]:::mth
  N17753 --> N17754
  N17755[setActiveTab()]:::mth
  N17753 --> N17755
  N17756[getActiveTab()]:::mth
  N17753 --> N17756
  N17757[updateUI()]:::mth
  N17753 --> N17757
  N17758[addTabChangeListener()]:::mth
  N17753 --> N17758
  N17759[File: theme-manager.ts]:::file
  N17549 --> N17759
  N17760[Class: ThemeManager]:::cls
  N17759 --> N17760
  N17761[setTheme()]:::mth
  N17760 --> N17761
  N17762[toggleTheme()]:::mth
  N17760 --> N17762
  N17763[getTheme()]:::mth
  N17760 --> N17763
  N17764[isDarkMode()]:::mth
  N17760 --> N17764
  N17765[applyTheme()]:::mth
  N17760 --> N17765
  N17766[File: theme.ts]:::file
  N17549 --> N17766
  N17767[Class: ThemeManager]:::cls
  N17766 --> N17767
  N17768[setTheme()]:::mth
  N17767 --> N17768
  N17769[getTheme()]:::mth
  N17767 --> N17769
  N17770[isDarkMode()]:::mth
  N17767 --> N17770
  N17771[applyTheme()]:::mth
  N17767 --> N17771
  N17772[addThemeChangeListener()]:::mth
  N17767 --> N17772
  N17773[File: BaseProcessor.ts]:::file
  N17549 --> N17773
  N17774[Class: for]:::cls
  N17773 --> N17774
  N17775[process()]:::mth
  N17774 --> N17775
  N17776[debug()]:::mth
  N17774 --> N17776
  N17777[logError()]:::mth
  N17774 --> N17777
  N17778[Class: BaseProcessor]:::cls
  N17773 --> N17778
  N17779[process()]:::mth
  N17778 --> N17779
  N17780[debug()]:::mth
  N17778 --> N17780
  N17781[logError()]:::mth
  N17778 --> N17781
  N17782[File: ApiClient.ts]:::file
  N17549 --> N17782
  N17783[Class: TheNewFuseApiClient]:::cls
  N17782 --> N17783
  N17784[loadConfig()]:::mth
  N17783 --> N17784
  N17785[authenticate()]:::mth
  N17783 --> N17785
  N17786[getAgents()]:::mth
  N17783 --> N17786
  N17787[createAgent()]:::mth
  N17783 --> N17787
  N17788[sendAgentMessage()]:::mth
  N17783 --> N17788
  N17791[File: setup.ts]:::file
  N17549 --> N17791
  N17792[Class: MockWebSocket]:::cls
  N17791 --> N17792
  N17793[send()]:::mth
  N17792 --> N17793
  N17794[close()]:::mth
  N17792 --> N17794
  N17798[File: websocket-manager.test.ts]:::file
  N17549 --> N17798
  N17799[Class: ErrorWebSocket]:::cls
  N17798 --> N17799
  N17800[close()]:::mth
  N17799 --> N17800
  N17801[send()]:::mth
  N17799 --> N17801
  N17804[File: ai-models.ts]:::file
  N17549 --> N17804
  N17805[Class: AIModelsManager]:::cls
  N17804 --> N17805
  N17806[handleMessage()]:::mth
  N17805 --> N17806
  N17807[handleModelsResponse()]:::mth
  N17805 --> N17807
  N17808[handleAIResponse()]:::mth
  N17805 --> N17808
  N17809[handleAIError()]:::mth
  N17805 --> N17809
  N17810[loadModels()]:::mth
  N17805 --> N17810
  N17811[File: code-snippets.ts]:::file
  N17549 --> N17811
  N17812[Class: CodeSnippetsManager]:::cls
  N17811 --> N17812
  N17813[loadSnippets()]:::mth
  N17812 --> N17813
  N17814[saveSnippets()]:::mth
  N17812 --> N17814
  N17815[addSnippet()]:::mth
  N17812 --> N17815
  N17816[updateSnippet()]:::mth
  N17812 --> N17816
  N17817[deleteSnippet()]:::mth
  N17812 --> N17817
  N17819[File: enhanced-theme.ts]:::file
  N17549 --> N17819
  N17820[Class: export]:::cls
  N17819 --> N17820
  N17821[generateThemeCSS()]:::mth
  N17820 --> N17821
  N17822[createMaterialUITheme()]:::mth
  N17820 --> N17822
  N17823[applyThemeToPage()]:::mth
  N17820 --> N17823
  N17824[detectSystemTheme()]:::mth
  N17820 --> N17824
  N17825[loadSavedTheme()]:::mth
  N17820 --> N17825
  N17826[Class: ThemeManager]:::cls
  N17819 --> N17826
  N17827[generateThemeCSS()]:::mth
  N17826 --> N17827
  N17828[createMaterialUITheme()]:::mth
  N17826 --> N17828
  N17829[applyThemeToPage()]:::mth
  N17826 --> N17829
  N17830[detectSystemTheme()]:::mth
  N17826 --> N17830
  N17831[loadSavedTheme()]:::mth
  N17826 --> N17831
  N17832[File: file-transfer.ts]:::file
  N17549 --> N17832
  N17833[Class: FileTransferManager]:::cls
  N17832 --> N17833
  N17834[isFileTransferMessage()]:::mth
  N17833 --> N17834
  N17835[isChunkAckMessage()]:::mth
  N17833 --> N17835
  N17836[isTransferCompleteMessage()]:::mth
  N17833 --> N17836
  N17837[isTransferErrorMessage()]:::mth
  N17833 --> N17837
  N17838[isTransferRequestMessage()]:::mth
  N17833 --> N17838
  N17839[File: floating-panel-manager.ts]:::file
  N17549 --> N17839
  N17840[Class: FloatingPanelManager]:::cls
  N17839 --> N17840
  N17841[initialize()]:::mth
  N17840 --> N17841
  N17842[createFloatingPanelIframe()]:::mth
  N17840 --> N17842
  N17843[makeDraggable()]:::mth
  N17840 --> N17843
  N17844[setupMessageListeners()]:::mth
  N17840 --> N17844
  N17845[show()]:::mth
  N17840 --> N17845
  N17847[File: logger.ts]:::file
  N17549 --> N17847
  N17848[Class: Logger]:::cls
  N17847 --> N17848
  N17849[shouldLog()]:::mth
  N17848 --> N17849
  N17850[formatMessage()]:::mth
  N17848 --> N17850
  N17851[writeLogEntry()]:::mth
  N17848 --> N17851
  N17852[debug()]:::mth
  N17848 --> N17852
  N17853[info()]:::mth
  N17848 --> N17853
  N17855[File: performance-optimizer.ts]:::file
  N17549 --> N17855
  N17856[Class: PerformanceOptimizer]:::cls
  N17855 --> N17856
  N17857[getInstance()]:::mth
  N17856 --> N17857
  N17858[getInitialMetrics()]:::mth
  N17856 --> N17858
  N17859[initialize()]:::mth
  N17856 --> N17859
  N17860[startMonitoring()]:::mth
  N17856 --> N17860
  N17861[stopMonitoring()]:::mth
  N17856 --> N17861
  N17862[File: rate-limiter.ts]:::file
  N17549 --> N17862
  N17863[Class: RateLimiter]:::cls
  N17862 --> N17863
  N17864[canMakeRequest()]:::mth
  N17863 --> N17864
  N17865[getTimeToNext()]:::mth
  N17863 --> N17865
  N17866[File: security.ts]:::file
  N17549 --> N17866
  N17867[Class: SecurityManager]:::cls
  N17866 --> N17867
  N17868[ensureKeyIsReady()]:::mth
  N17867 --> N17868
  N17869[setSharedSecret()]:::mth
  N17867 --> N17869
  N17870[loadSharedSecret()]:::mth
  N17867 --> N17870
  N17871[deriveKeyFromSecret()]:::mth
  N17867 --> N17871
  N17872[encryptMessage()]:::mth
  N17867 --> N17872
  N17873[File: settings-manager.ts]:::file
  N17549 --> N17873
  N17874[Class: SettingsManager]:::cls
  N17873 --> N17874
  N17875[getInstance()]:::mth
  N17874 --> N17875
  N17876[getDefaultSettings()]:::mth
  N17874 --> N17876
  N17877[initialize()]:::mth
  N17874 --> N17877
  N17878[loadSettings()]:::mth
  N17874 --> N17878
  N17879[saveSettings()]:::mth
  N17874 --> N17879
  N17880[File: store.ts]:::file
  N17549 --> N17880
  N17881[Class: for]:::cls
  N17880 --> N17881
  N17882[getInstance()]:::mth
  N17881 --> N17882
  N17883[resolve()]:::mth
  N17881 --> N17883
  N17884[Class: Store]:::cls
  N17880 --> N17884
  N17885[getInstance()]:::mth
  N17884 --> N17885
  N17886[resolve()]:::mth
  N17884 --> N17886
  N17887[File: tnf-message-formatter.ts]:::file
  N17549 --> N17887
  N17888[Class: TNFMessageFormatter]:::cls
  N17887 --> N17888
  N17889[formatForClaudeDesktop()]:::mth
  N17888 --> N17889
  N17890[formatElementDetection()]:::mth
  N17888 --> N17890
  N17891[formatConnectionStatus()]:::mth
  N17888 --> N17891
  N17892[detectPlatform()]:::mth
  N17888 --> N17892
  N17893[generateMessageId()]:::mth
  N17888 --> N17893
  N17895[File: websocket-manager.ts]:::file
  N17549 --> N17895
  N17896[Class: WebSocketManager]:::cls
  N17895 --> N17896
  N17897[getState()]:::mth
  N17896 --> N17897
  N17898[connect()]:::mth
  N17896 --> N17898
  N17899[setSecurityManager()]:::mth
  N17896 --> N17899
  N17900[send()]:::mth
  N17896 --> N17900
  N17901[disconnect()]:::mth
  N17896 --> N17901
  N17903[File: index.ts]:::file
  N17549 --> N17903
  N17904[Class: BackgroundService]:::cls
  N17903 --> N17904
  N17905[init()]:::mth
  N17904 --> N17905
  N17906[startCleanupTimer()]:::mth
  N17904 --> N17906
  N17907[tryInitialConnection()]:::mth
  N17904 --> N17907
  N17908[checkRelayHealth()]:::mth
  N17904 --> N17908
  N17909[getOrCreateAgentId()]:::mth
  N17904 --> N17909
  N17910[File: SimpleChatBridge.ts]:::file
  N17549 --> N17910
  N17911[Class: SimpleChatBridge]:::cls
  N17910 --> N17911
  N17912[isSupportedPlatform()]:::mth
  N17911 --> N17912
  N17913[init()]:::mth
  N17911 --> N17913
  N17914[findElements()]:::mth
  N17911 --> N17914
  N17915[input()]:::mth
  N17911 --> N17915
  N17916[button()]:::mth
  N17911 --> N17916
  N17917[File: SiteConfigs.ts]:::file
  N17549 --> N17917
  N17918[Class: while]:::cls
  N17917 --> N17918
  N17919[getSiteConfig()]:::mth
  N17918 --> N17919
  N17920[File: UniversalChatDetector.ts]:::file
  N17549 --> N17920
  N17921[Class: UniversalChatDetector]:::cls
  N17920 --> N17921
  N17922[startDetection()]:::mth
  N17921 --> N17922
  N17923[stopDetection()]:::mth
  N17921 --> N17923
  N17924[getElements()]:::mth
  N17921 --> N17924
  N17925[detectElements()]:::mth
  N17921 --> N17925
  N17926[findInputElement()]:::mth
  N17921 --> N17926
  N17928[File: index.ts]:::file
  N17549 --> N17928
  N17929[Class: GeminiBridgeContentScript]:::cls
  N17928 --> N17929
  N17930[init()]:::mth
  N17929 --> N17930
  N17931[setup()]:::mth
  N17929 --> N17931
  N17932[startChatDetection()]:::mth
  N17929 --> N17932
  N17933[setupDebugUtils()]:::mth
  N17929 --> N17933
  N17934[showPanel()]:::mth
  N17929 --> N17934
  N17935[File: FloatingPanel.ts]:::file
  N17549 --> N17935
  N17936[Class: EnhancedFloatingPanel]:::cls
  N17935 --> N17936
  N17937[startCleanupInterval()]:::mth
  N17936 --> N17937
  N17938[requestConnectionState()]:::mth
  N17936 --> N17938
  N17939[loadState()]:::mth
  N17936 --> N17939
  N17940[saveState()]:::mth
  N17936 --> N17940
  N17941[inject()]:::mth
  N17936 --> N17941
  N17942[Class: methods]:::cls
  N17935 --> N17942
  N17943[startCleanupInterval()]:::mth
  N17942 --> N17943
  N17944[requestConnectionState()]:::mth
  N17942 --> N17944
  N17945[loadState()]:::mth
  N17942 --> N17945
  N17946[saveState()]:::mth
  N17942 --> N17946
  N17947[inject()]:::mth
  N17942 --> N17947
  N17948[File: self-prompting.ts]:::file
  N17549 --> N17948
  N17949[Class: SelfPrompter]:::cls
  N17948 --> N17949
  N17950[updateActivity()]:::mth
  N17949 --> N17950
  N17951[enable()]:::mth
  N17949 --> N17951
  N17952[disable()]:::mth
  N17949 --> N17952
  N17953[checkAndPrompt()]:::mth
  N17949 --> N17953
  N17954[selectPrompt()]:::mth
  N17949 --> N17954
  N17955[File: AccessibilityTree.ts]:::file
  N17549 --> N17955
  N17956[Class: AccessibilityTreeGenerator]:::cls
  N17955 --> N17956
  N17957[generateTree()]:::mth
  N17956 --> N17957
  N17958[processElement()]:::mth
  N17956 --> N17958
  N17959[shouldIncludeElement()]:::mth
  N17956 --> N17959
  N17960[getRole()]:::mth
  N17956 --> N17960
  N17961[getLabel()]:::mth
  N17956 --> N17961
  N17962[File: AgentVisualIndicator.ts]:::file
  N17549 --> N17962
  N17963[Class: AgentVisualIndicator]:::cls
  N17962 --> N17963
  N17964[showAgentActive()]:::mth
  N17963 --> N17964
  N17965[hideAgentActive()]:::mth
  N17963 --> N17965
  N17966[showStaticIndicator()]:::mth
  N17963 --> N17966
  N17967[hideStaticIndicator()]:::mth
  N17963 --> N17967
  N17968[hideForToolUse()]:::mth
  N17963 --> N17968
  N17969[File: CaptchaHandler.ts]:::file
  N17549 --> N17969
  N17970[Class: CaptchaHandler]:::cls
  N17969 --> N17970
  N17971[detectCaptcha()]:::mth
  N17970 --> N17971
  N17972[attemptBypass()]:::mth
  N17970 --> N17972
  N17973[waitForCaptchaSolved()]:::mth
  N17970 --> N17973
  N17974[detectRecaptchaV2()]:::mth
  N17970 --> N17974
  N17975[detectRecaptchaV3()]:::mth
  N17970 --> N17975
  N17976[File: HumanBehaviorSimulator.ts]:::file
  N17549 --> N17976
  N17977[Class: HumanBehaviorSimulator]:::cls
  N17976 --> N17977
  N17978[randomDelay()]:::mth
  N17977 --> N17978
  N17979[humanDelay()]:::mth
  N17977 --> N17979
  N17980[microPause()]:::mth
  N17977 --> N17980
  N17981[thinkingPause()]:::mth
  N17977 --> N17981
  N17982[moveMouse()]:::mth
  N17977 --> N17982
  N17986[File: NativeMessaging.ts]:::file
  N17549 --> N17986
  N17987[Class: NativeMessaging]:::cls
  N17986 --> N17987
  N17988[isAvailable()]:::mth
  N17987 --> N17988
  N17989[sendMessage()]:::mth
  N17987 --> N17989
  N17990[ping()]:::mth
  N17987 --> N17990
  N17991[getStatus()]:::mth
  N17987 --> N17991
  N17992[startService()]:::mth
  N17987 --> N17992
  N17993[File: index.ts]:::file
  N17549 --> N17993
  N17994[Class: BackgroundService]:::cls
  N17993 --> N17994
  N17995[init()]:::mth
  N17994 --> N17995
  N17996[startCleanupTimer()]:::mth
  N17994 --> N17996
  N17997[tryInitialConnection()]:::mth
  N17994 --> N17997
  N17998[checkRelayHealth()]:::mth
  N17994 --> N17998
  N17999[getOrCreateAgentId()]:::mth
  N17994 --> N17999
  N18000[File: SimpleChatBridge.ts]:::file
  N17549 --> N18000
  N18001[Class: SimpleChatBridge]:::cls
  N18000 --> N18001
  N18002[upgrade()]:::mth
  N18001 --> N18002
  N18003[isExtensionUiElement()]:::mth
  N18001 --> N18003
  N18004[isSupportedPlatform()]:::mth
  N18001 --> N18004
  N18005[init()]:::mth
  N18001 --> N18005
  N18006[loadCustomSites()]:::mth
  N18001 --> N18006
  N18007[File: SiteConfigs.ts]:::file
  N17549 --> N18007
  N18008[Class: while]:::cls
  N18007 --> N18008
  N18009[getSiteConfig()]:::mth
  N18008 --> N18009
  N18010[File: UniversalChatDetector.ts]:::file
  N17549 --> N18010
  N18011[Class: UniversalChatDetector]:::cls
  N18010 --> N18011
  N18012[startDetection()]:::mth
  N18011 --> N18012
  N18013[stopDetection()]:::mth
  N18011 --> N18013
  N18014[getElements()]:::mth
  N18011 --> N18014
  N18015[detectElements()]:::mth
  N18011 --> N18015
  N18016[findInputElement()]:::mth
  N18011 --> N18016
  N18018[File: index.ts]:::file
  N17549 --> N18018
  N18019[Class: GeminiBridgeContentScript]:::cls
  N18018 --> N18019
  N18020[init()]:::mth
  N18019 --> N18020
  N18021[setup()]:::mth
  N18019 --> N18021
  N18022[startChatDetection()]:::mth
  N18019 --> N18022
  N18023[setupDebugUtils()]:::mth
  N18019 --> N18023
  N18024[showPanel()]:::mth
  N18019 --> N18024
  N18025[File: FloatingPanel.ts]:::file
  N17549 --> N18025
  N18026[Class: EnhancedFloatingPanel]:::cls
  N18025 --> N18026
  N18027[startCleanupInterval()]:::mth
  N18026 --> N18027
  N18028[requestConnectionState()]:::mth
  N18026 --> N18028
  N18029[loadState()]:::mth
  N18026 --> N18029
  N18030[saveState()]:::mth
  N18026 --> N18030
  N18031[inject()]:::mth
  N18026 --> N18031
  N18032[File: self-prompting.ts]:::file
  N17549 --> N18032
  N18033[Class: SelfPrompter]:::cls
  N18032 --> N18033
  N18034[updateActivity()]:::mth
  N18033 --> N18034
  N18035[enable()]:::mth
  N18033 --> N18035
  N18036[disable()]:::mth
  N18033 --> N18036
  N18037[checkAndPrompt()]:::mth
  N18033 --> N18037
  N18038[selectPrompt()]:::mth
  N18033 --> N18038
  N18039[File: AccessibilityTree.ts]:::file
  N17549 --> N18039
  N18040[Class: AccessibilityTreeGenerator]:::cls
  N18039 --> N18040
  N18041[generateTree()]:::mth
  N18040 --> N18041
  N18042[processElement()]:::mth
  N18040 --> N18042
  N18043[shouldIncludeElement()]:::mth
  N18040 --> N18043
  N18044[getRole()]:::mth
  N18040 --> N18044
  N18045[getLabel()]:::mth
  N18040 --> N18045
  N18046[File: AgentVisualIndicator.ts]:::file
  N17549 --> N18046
  N18047[Class: AgentVisualIndicator]:::cls
  N18046 --> N18047
  N18048[showAgentActive()]:::mth
  N18047 --> N18048
  N18049[hideAgentActive()]:::mth
  N18047 --> N18049
  N18050[showStaticIndicator()]:::mth
  N18047 --> N18050
  N18051[hideStaticIndicator()]:::mth
  N18047 --> N18051
  N18052[hideForToolUse()]:::mth
  N18047 --> N18052
  N18053[File: CaptchaHandler.ts]:::file
  N17549 --> N18053
  N18054[Class: CaptchaHandler]:::cls
  N18053 --> N18054
  N18055[detectCaptcha()]:::mth
  N18054 --> N18055
  N18056[attemptBypass()]:::mth
  N18054 --> N18056
  N18057[waitForCaptchaSolved()]:::mth
  N18054 --> N18057
  N18058[detectRecaptchaV2()]:::mth
  N18054 --> N18058
  N18059[detectRecaptchaV3()]:::mth
  N18054 --> N18059
  N18060[File: HumanBehaviorSimulator.ts]:::file
  N17549 --> N18060
  N18061[Class: HumanBehaviorSimulator]:::cls
  N18060 --> N18061
  N18062[randomDelay()]:::mth
  N18061 --> N18062
  N18063[humanDelay()]:::mth
  N18061 --> N18063
  N18064[microPause()]:::mth
  N18061 --> N18064
  N18065[thinkingPause()]:::mth
  N18061 --> N18065
  N18066[moveMouse()]:::mth
  N18061 --> N18066
  N18067[File: TnfTranscriptClient.ts]:::file
  N17549 --> N18067
  N18068[Class: TnfTranscriptClient]:::cls
  N18067 --> N18068
  N18069[latest()]:::mth
  N18068 --> N18069
  N18070[since()]:::mth
  N18068 --> N18070
  N18071[append()]:::mth
  N18068 --> N18071
  N18072[File: PokerTechnicianService.ts]:::file
  N17549 --> N18072
  N18073[Class: PokerTechnicianService]:::cls
  N18072 --> N18073
  N18074[getInstance()]:::mth
  N18073 --> N18074
  N18075[activate()]:::mth
  N18073 --> N18075
  N18076[deactivate()]:::mth
  N18073 --> N18076
  N18077[pushGameState()]:::mth
  N18073 --> N18077
  N18078[getStatus()]:::mth
  N18073 --> N18078
  N18082[File: NativeMessaging.ts]:::file
  N17549 --> N18082
  N18083[Class: NativeMessaging]:::cls
  N18082 --> N18083
  N18084[isAvailable()]:::mth
  N18083 --> N18084
  N18085[sendMessage()]:::mth
  N18083 --> N18085
  N18086[ping()]:::mth
  N18083 --> N18086
  N18087[getStatus()]:::mth
  N18083 --> N18087
  N18088[startService()]:::mth
  N18083 --> N18088
  N18089[mcp-servers]:::pkg
  TNF --> N18089
  N18092[nexus-orchestrator]:::pkg
  TNF --> N18092
  N18093[File: geminiService.ts]:::file
  N18092 --> N18093
  N18094[Class: role]:::cls
  N18093 --> N18094
  N18098[openclaw]:::pkg
  TNF --> N18098
  N18099[File: audio.ts]:::file
  N18098 --> N18099
  N18100[Class: Audio]:::cls
  N18099 --> N18100
  N18101[File: button.ts]:::file
  N18098 --> N18101
  N18102[Class: Button]:::cls
  N18101 --> N18102
  N18103[handleClick()]:::mth
  N18102 --> N18103
  N18104[File: card.ts]:::file
  N18098 --> N18104
  N18105[Class: Card]:::cls
  N18104 --> N18105
  N18106[File: checkbox.ts]:::file
  N18098 --> N18106
  N18107[Class: Checkbox]:::cls
  N18106 --> N18107
  N18108[handleChange()]:::mth
  N18107 --> N18108
  N18109[File: column.ts]:::file
  N18098 --> N18109
  N18110[Class: Column]:::cls
  N18109 --> N18110
  N18111[File: datetime-input.ts]:::file
  N18098 --> N18111
  N18112[Class: DatetimeInput]:::cls
  N18111 --> N18112
  N18113[Date()]:::mth
  N18112 --> N18113
  N18114[handleInput()]:::mth
  N18112 --> N18114
  N18115[padNumber()]:::mth
  N18112 --> N18115
  N18117[File: divider.ts]:::file
  N18098 --> N18117
  N18118[Class: Divider]:::cls
  N18117 --> N18118
  N18119[File: icon.ts]:::file
  N18098 --> N18119
  N18120[Class: Icon]:::cls
  N18119 --> N18120
  N18121[File: image.ts]:::file
  N18098 --> N18121
  N18122[Class: Image]:::cls
  N18121 --> N18122
  N18123[File: list.ts]:::file
  N18098 --> N18123
  N18124[Class: List]:::cls
  N18123 --> N18124
  N18125[File: modal.ts]:::file
  N18098 --> N18125
  N18126[Class: Modal]:::cls
  N18125 --> N18126
  N18127[handleDialogClick()]:::mth
  N18126 --> N18127
  N18128[closeDialog()]:::mth
  N18126 --> N18128
  N18129[File: multiple-choice.ts]:::file
  N18098 --> N18129
  N18130[Class: MultipleChoice]:::cls
  N18129 --> N18130
  N18131[handleChange()]:::mth
  N18130 --> N18131
  N18132[File: row.ts]:::file
  N18098 --> N18132
  N18133[Class: Row]:::cls
  N18132 --> N18133
  N18134[File: slider.ts]:::file
  N18098 --> N18134
  N18135[Class: Slider]:::cls
  N18134 --> N18135
  N18136[handleInput()]:::mth
  N18135 --> N18136
  N18137[File: surface.ts]:::file
  N18098 --> N18137
  N18138[Class: Surface]:::cls
  N18137 --> N18138
  N18139[File: tabs.ts]:::file
  N18098 --> N18139
  N18140[Class: Tabs]:::cls
  N18139 --> N18140
  N18141[File: text-field.ts]:::file
  N18098 --> N18141
  N18142[Class: TextField]:::cls
  N18141 --> N18142
  N18143[handleInput()]:::mth
  N18142 --> N18143
  N18144[File: text.ts]:::file
  N18098 --> N18144
  N18145[Class: Text]:::cls
  N18144 --> N18145
  N18146[areHintedStyles()]:::mth
  N18145 --> N18146
  N18147[File: video.ts]:::file
  N18098 --> N18147
  N18148[Class: Video]:::cls
  N18147 --> N18148
  N18151[File: markdown.ts]:::file
  N18098 --> N18151
  N18152[Class: MarkdownRenderer]:::cls
  N18151 --> N18152
  N18153[render()]:::mth
  N18152 --> N18153
  N18154[applyTagClassMap()]:::mth
  N18152 --> N18154
  N18155[unapplyTagClassMap()]:::mth
  N18152 --> N18155
  N18156[File: processor.ts]:::file
  N18098 --> N18156
  N18157[Class: MessageProcessor]:::cls
  N18156 --> N18157
  N18158[setData()]:::mth
  N18157 --> N18158
  N18159[dispatch()]:::mth
  N18157 --> N18159
  N18162[File: dynamic-component.ts]:::file
  N18098 --> N18162
  N18163[Class: DynamicComponent]:::cls
  N18162 --> N18163
  N18164[sendAction()]:::mth
  N18163 --> N18164
  N18165[resolvePrimitive()]:::mth
  N18163 --> N18165
  N18166[getUniqueId()]:::mth
  N18163 --> N18166
  N18168[File: renderer.ts]:::file
  N18098 --> N18168
  N18169[Class: Renderer]:::cls
  N18168 --> N18169
  N18170[ngOnDestroy()]:::mth
  N18169 --> N18170
  N18171[render()]:::mth
  N18169 --> N18171
  N18172[clear()]:::mth
  N18169 --> N18172
  N18177[File: model-processor.ts]:::file
  N18098 --> N18177
  N18178[Class: A2uiMessageProcessor]:::cls
  N18177 --> N18178
  N18179[getSurfaces()]:::mth
  N18178 --> N18179
  N18180[clearSurfaces()]:::mth
  N18178 --> N18180
  N18181[processMessages()]:::mth
  N18178 --> N18181
  N18182[getData()]:::mth
  N18178 --> N18182
  N18183[setData()]:::mth
  N18178 --> N18183
  N18187[File: events.ts]:::file
  N18098 --> N18187
  N18188[Class: StateEvent]:::cls
  N18187 --> N18188
  N18206[File: audio.ts]:::file
  N18098 --> N18206
  N18207[Class: Audio]:::cls
  N18206 --> N18207
  N18208[render()]:::mth
  N18207 --> N18208
  N18209[styleMap()]:::mth
  N18207 --> N18209
  N18210[File: button.ts]:::file
  N18098 --> N18210
  N18211[Class: Button]:::cls
  N18210 --> N18211
  N18212[render()]:::mth
  N18211 --> N18212
  N18213[styleMap()]:::mth
  N18211 --> N18213
  N18214[File: card.ts]:::file
  N18098 --> N18214
  N18215[Class: Card]:::cls
  N18214 --> N18215
  N18216[render()]:::mth
  N18215 --> N18216
  N18217[File: checkbox.ts]:::file
  N18098 --> N18217
  N18218[Class: Checkbox]:::cls
  N18217 --> N18218
  N18219[styleMap()]:::mth
  N18218 --> N18219
  N18220[render()]:::mth
  N18218 --> N18220
  N18221[File: column.ts]:::file
  N18098 --> N18221
  N18222[Class: Column]:::cls
  N18221 --> N18222
  N18223[render()]:::mth
  N18222 --> N18223
  N18224[File: component-registry.ts]:::file
  N18098 --> N18224
  N18225[Class: ComponentRegistry]:::cls
  N18224 --> N18225
  N18226[register()]:::mth
  N18225 --> N18226
  N18227[get()]:::mth
  N18225 --> N18227
  N18230[File: datetime-input.ts]:::file
  N18098 --> N18230
  N18231[Class: DateTimeInput]:::cls
  N18230 --> N18231
  N18232[styleMap()]:::mth
  N18231 --> N18232
  N18233[Date()]:::mth
  N18231 --> N18233
  N18234[render()]:::mth
  N18231 --> N18234
  N18236[File: markdown.ts]:::file
  N18098 --> N18236
  N18237[Class: MarkdownDirective]:::cls
  N18236 --> N18237
  N18238[update()]:::mth
  N18237 --> N18238
  N18239[render()]:::mth
  N18237 --> N18239
  N18240[renderMarkdownToHtmlString()]:::mth
  N18237 --> N18240
  N18242[File: divider.ts]:::file
  N18098 --> N18242
  N18243[Class: Divider]:::cls
  N18242 --> N18243
  N18244[render()]:::mth
  N18243 --> N18244
  N18245[File: icon.ts]:::file
  N18098 --> N18245
  N18246[Class: Icon]:::cls
  N18245 --> N18246
  N18247[render()]:::mth
  N18246 --> N18247
  N18248[styleMap()]:::mth
  N18246 --> N18248
  N18249[File: image.ts]:::file
  N18098 --> N18249
  N18250[Class: Image]:::cls
  N18249 --> N18250
  N18251[render()]:::mth
  N18250 --> N18251
  N18252[File: list.ts]:::file
  N18098 --> N18252
  N18253[Class: List]:::cls
  N18252 --> N18253
  N18254[render()]:::mth
  N18253 --> N18254
  N18255[File: modal.ts]:::file
  N18098 --> N18255
  N18256[Class: Modal]:::cls
  N18255 --> N18256
  N18257[render()]:::mth
  N18256 --> N18257
  N18258[styleMap()]:::mth
  N18256 --> N18258
  N18259[File: multiple-choice.ts]:::file
  N18098 --> N18259
  N18260[Class: MultipleChoice]:::cls
  N18259 --> N18260
  N18261[willUpdate()]:::mth
  N18260 --> N18261
  N18262[render()]:::mth
  N18260 --> N18262
  N18263[styleMap()]:::mth
  N18260 --> N18263
  N18264[File: root.ts]:::file
  N18098 --> N18264
  N18265[Class: all]:::cls
  N18264 --> N18265
  N18266[weight()]:::mth
  N18265 --> N18266
  N18267[weight()]:::mth
  N18265 --> N18267
  N18268[willUpdate()]:::mth
  N18265 --> N18268
  N18269[disconnectedCallback()]:::mth
  N18265 --> N18269
  N18270[renderComponentTree()]:::mth
  N18265 --> N18270
  N18271[Class: Root]:::cls
  N18264 --> N18271
  N18272[weight()]:::mth
  N18271 --> N18272
  N18273[weight()]:::mth
  N18271 --> N18273
  N18274[willUpdate()]:::mth
  N18271 --> N18274
  N18275[disconnectedCallback()]:::mth
  N18271 --> N18275
  N18276[renderComponentTree()]:::mth
  N18271 --> N18276
  N18277[File: row.ts]:::file
  N18098 --> N18277
  N18278[Class: Row]:::cls
  N18277 --> N18278
  N18279[render()]:::mth
  N18278 --> N18279
  N18280[File: slider.ts]:::file
  N18098 --> N18280
  N18281[Class: Slider]:::cls
  N18280 --> N18281
  N18282[styleMap()]:::mth
  N18281 --> N18282
  N18283[extractNumberValue()]:::mth
  N18281 --> N18283
  N18285[File: surface.ts]:::file
  N18098 --> N18285
  N18286[Class: Surface]:::cls
  N18285 --> N18286
  N18287[render()]:::mth
  N18286 --> N18287
  N18288[File: tabs.ts]:::file
  N18098 --> N18288
  N18289[Class: Tabs]:::cls
  N18288 --> N18289
  N18290[willUpdate()]:::mth
  N18289 --> N18290
  N18291[render()]:::mth
  N18289 --> N18291
  N18292[styleMap()]:::mth
  N18289 --> N18292
  N18293[File: text-field.ts]:::file
  N18098 --> N18293
  N18294[Class: TextField]:::cls
  N18293 --> N18294
  N18295[styleMap()]:::mth
  N18294 --> N18295
  N18296[render()]:::mth
  N18294 --> N18296
  N18297[File: text.ts]:::file
  N18098 --> N18297
  N18298[Class: Text]:::cls
  N18297 --> N18298
  N18299[render()]:::mth
  N18298 --> N18299
  N18303[File: video.ts]:::file
  N18098 --> N18303
  N18304[Class: Video]:::cls
  N18303 --> N18304
  N18305[render()]:::mth
  N18304 --> N18305
  N18306[styleMap()]:::mth
  N18304 --> N18306
  N18308[File: basic_schema_matcher.ts]:::file
  N18098 --> N18308
  N18309[Class: BasicSchemaMatcher]:::cls
  N18308 --> N18309
  N18310[validate()]:::mth
  N18309 --> N18310
  N18314[File: message_type_matcher.ts]:::file
  N18098 --> N18314
  N18315[Class: MessageTypeMatcher]:::cls
  N18314 --> N18315
  N18316[validate()]:::mth
  N18315 --> N18316
  N18317[description()]:::mth
  N18315 --> N18317
  N18320[File: schema_matcher.ts]:::file
  N18098 --> N18320
  N18321[Class: SchemaMatcher]:::cls
  N18320 --> N18321
  N18322[File: surface_update_schema_matcher.ts]:::file
  N18098 --> N18322
  N18323[Class: SurfaceUpdateSchemaMatcher]:::cls
  N18322 --> N18323
  N18324[getComponentById()]:::mth
  N18323 --> N18324
  N18325[validate()]:::mth
  N18323 --> N18325
  N18326[valueMatches()]:::mth
  N18323 --> N18326
  N18332[File: evaluator.ts]:::file
  N18098 --> N18332
  N18333[Class: Evaluator]:::cls
  N18332 --> N18333
  N18334[run()]:::mth
  N18333 --> N18334
  N18335[runJob()]:::mth
  N18333 --> N18335
  N18336[saveEvaluation()]:::mth
  N18333 --> N18336
  N18338[File: generator.ts]:::file
  N18098 --> N18338
  N18339[Class: Generator]:::cls
  N18338 --> N18339
  N18340[run()]:::mth
  N18339 --> N18340
  N18341[runJob()]:::mth
  N18339 --> N18341
  N18342[saveArtifacts()]:::mth
  N18339 --> N18342
  N18343[saveError()]:::mth
  N18339 --> N18343
  N18348[File: rateLimiter.ts]:::file
  N18098 --> N18348
  N18349[Class: RateLimiter]:::cls
  N18348 --> N18349
  N18350[waitingCount()]:::mth
  N18349 --> N18350
  N18351[getModelState()]:::mth
  N18349 --> N18351
  N18352[cleanUpRecords()]:::mth
  N18349 --> N18352
  N18353[reportError()]:::mth
  N18349 --> N18353
  N18354[acquirePermit()]:::mth
  N18349 --> N18354
  N18357[File: validator.ts]:::file
  N18098 --> N18357
  N18358[Class: Validator]:::cls
  N18357 --> N18358
  N18359[run()]:::mth
  N18358 --> N18359
  N18360[saveFailure()]:::mth
  N18358 --> N18360
  N18361[validateCustom()]:::mth
  N18358 --> N18361
  N18362[validateCreateSurface()]:::mth
  N18358 --> N18362
  N18363[validateDeleteSurface()]:::mth
  N18358 --> N18363
  N18364[picoclaw-overseer]:::pkg
  TNF --> N18364
  N18365[poker-room]:::pkg
  TNF --> N18365
  N18376[relay-server]:::pkg
  TNF --> N18376
  N18377[skideancer-ide]:::pkg
  TNF --> N18377
  N18379[File: ai-agent-view-contribution.ts]:::file
  N18377 --> N18379
  N18380[Class: AIAgentViewContribution]:::cls
  N18379 --> N18380
  N18381[init()]:::mth
  N18380 --> N18381
  N18382[initializeLayout()]:::mth
  N18380 --> N18382
  N18383[registerCommands()]:::mth
  N18380 --> N18383
  N18384[registerMenus()]:::mth
  N18380 --> N18384
  N18385[analyzeCurrentFile()]:::mth
  N18380 --> N18385
  N18387[File: agent-service.ts]:::file
  N18377 --> N18387
  N18388[Class: AgentServiceImpl]:::cls
  N18387 --> N18388
  N18389[init()]:::mth
  N18388 --> N18389
  N18390[dispose()]:::mth
  N18388 --> N18390
  N18391[getCapabilities()]:::mth
  N18388 --> N18391
  N18392[registerCapability()]:::mth
  N18388 --> N18392
  N18393[unregisterCapability()]:::mth
  N18388 --> N18393
  N18394[File: ai-flow-service.ts]:::file
  N18377 --> N18394
  N18395[Class: AIFlowServiceImpl]:::cls
  N18394 --> N18395
  N18396[init()]:::mth
  N18395 --> N18396
  N18397[dispose()]:::mth
  N18395 --> N18397
  N18398[registerStep()]:::mth
  N18395 --> N18398
  N18399[unregisterStep()]:::mth
  N18395 --> N18399
  N18400[getRegisteredSteps()]:::mth
  N18395 --> N18400
  N18401[File: code-analysis.ts]:::file
  N18377 --> N18401
  N18402[Class: CodeAnalysisCapability]:::cls
  N18401 --> N18402
  N18403[execute()]:::mth
  N18402 --> N18403
  N18404[analyzeCode()]:::mth
  N18402 --> N18404
  N18405[analyzeLine()]:::mth
  N18402 --> N18405
  N18406[analyzeDocument()]:::mth
  N18402 --> N18406
  N18407[calculateMetrics()]:::mth
  N18402 --> N18407
  N18409[File: semantic-navigation.ts]:::file
  N18377 --> N18409
  N18410[Class: SemanticNavigationCapability]:::cls
  N18409 --> N18410
  N18411[execute()]:::mth
  N18410 --> N18411
  N18412[parseQuery()]:::mth
  N18410 --> N18412
  N18413[findLocations()]:::mth
  N18410 --> N18413
  N18414[extractMainSymbol()]:::mth
  N18410 --> N18414
  N18415[detectLocationType()]:::mth
  N18410 --> N18415
  N18416[File: suggestion-processor.ts]:::file
  N18377 --> N18416
  N18417[Class: SuggestionProcessorCapability]:::cls
  N18416 --> N18417
  N18418[execute()]:::mth
  N18417 --> N18418
  N18419[buildContext()]:::mth
  N18417 --> N18419
  N18420[extractDocumentContext()]:::mth
  N18417 --> N18420
  N18421[getLanguagePatterns()]:::mth
  N18417 --> N18421
  N18422[generateSuggestions()]:::mth
  N18417 --> N18422
  N18423[Class: definition]:::cls
  N18416 --> N18423
  N18424[execute()]:::mth
  N18423 --> N18424
  N18425[buildContext()]:::mth
  N18423 --> N18425
  N18426[extractDocumentContext()]:::mth
  N18423 --> N18426
  N18427[getLanguagePatterns()]:::mth
  N18423 --> N18427
  N18428[generateSuggestions()]:::mth
  N18423 --> N18428
  N18430[File: embedding-vector-service.ts]:::file
  N18377 --> N18430
  N18431[Class: EmbeddingVectorServiceImpl]:::cls
  N18430 --> N18431
  N18432[provideEmbedding()]:::mth
  N18431 --> N18432
  N18433[isEnabled()]:::mth
  N18431 --> N18433
  N18434[init()]:::mth
  N18431 --> N18434
  N18435[dispose()]:::mth
  N18431 --> N18435
  N18436[isEnabled()]:::mth
  N18431 --> N18436
  N18437[Class: SimpleEmbeddingProvider]:::cls
  N18430 --> N18437
  N18438[provideEmbedding()]:::mth
  N18437 --> N18438
  N18439[isEnabled()]:::mth
  N18437 --> N18439
  N18440[init()]:::mth
  N18437 --> N18440
  N18441[dispose()]:::mth
  N18437 --> N18441
  N18442[isEnabled()]:::mth
  N18437 --> N18442
  N18444[File: related-information-service.ts]:::file
  N18377 --> N18444
  N18445[Class: RelatedInformationServiceImpl]:::cls
  N18444 --> N18445
  N18446[provideRelatedInformation()]:::mth
  N18445 --> N18446
  N18447[isEnabled()]:::mth
  N18445 --> N18447
  N18448[init()]:::mth
  N18445 --> N18448
  N18449[dispose()]:::mth
  N18445 --> N18449
  N18450[isEnabled()]:::mth
  N18445 --> N18450
  N18454[File: security-headers-contribution.ts]:::file
  N18377 --> N18454
  N18455[Class: SecurityHeadersContribution]:::cls
  N18454 --> N18455
  N18456[envFlag()]:::mth
  N18455 --> N18456
  N18457[configure()]:::mth
  N18455 --> N18457
  N18458[stripe-provider-bridge]:::pkg
  TNF --> N18458
  N18460[tauri-desktop]:::pkg
  TNF --> N18460
  N18465[File: BrowserControlService.ts]:::file
  N18460 --> N18465
  N18466[Class: BrowserControlServiceClass]:::cls
  N18465 --> N18466
  N18467[setRelayUrl()]:::mth
  N18466 --> N18467
  N18468[connect()]:::mth
  N18466 --> N18468
  N18469[disconnect()]:::mth
  N18466 --> N18469
  N18470[isConnected()]:::mth
  N18466 --> N18470
  N18471[isExtensionConnected()]:::mth
  N18466 --> N18471
  N18472[File: EventEmitter.ts]:::file
  N18460 --> N18472
  N18473[Class: EventEmitter]:::cls
  N18472 --> N18473
  N18474[off()]:::mth
  N18473 --> N18474
  N18475[removeAllListeners()]:::mth
  N18473 --> N18475
  N18476[listenerCount()]:::mth
  N18473 --> N18476
  N18477[File: OAGIService.ts]:::file
  N18460 --> N18477
  N18478[Class: OAGIService]:::cls
  N18477 --> N18478
  N18479[createSession()]:::mth
  N18478 --> N18479
  N18480[captureScreen()]:::mth
  N18478 --> N18480
  N18481[click()]:::mth
  N18478 --> N18481
  N18482[type()]:::mth
  N18478 --> N18482
  N18483[scroll()]:::mth
  N18478 --> N18483
  N18484[File: RelaySwarmService.ts]:::file
  N18460 --> N18484
  N18485[Class: RelaySwarmService]:::cls
  N18484 --> N18485
  N18486[connect()]:::mth
  N18485 --> N18486
  N18487[handleMessage()]:::mth
  N18485 --> N18487
  N18488[send()]:::mth
  N18485 --> N18488
  N18489[notify()]:::mth
  N18485 --> N18489
  N18490[getAgents()]:::mth
  N18485 --> N18490
  N18491[File: antigravity.ts]:::file
  N18460 --> N18491
  N18492[Class: AntigravityServiceClass]:::cls
  N18491 --> N18492
  N18493[initialize()]:::mth
  N18492 --> N18493
  N18494[connect()]:::mth
  N18492 --> N18494
  N18495[disconnect()]:::mth
  N18492 --> N18495
  N18496[getStatus()]:::mth
  N18492 --> N18496
  N18497[getUserSettings()]:::mth
  N18492 --> N18497
  N18498[File: api.ts]:::file
  N18460 --> N18498
  N18499[Class: ApiService]:::cls
  N18498 --> N18499
  N18500[setBaseUrl()]:::mth
  N18499 --> N18500
  N18501[setToken()]:::mth
  N18499 --> N18501
  N18502[getAgents()]:::mth
  N18499 --> N18502
  N18503[getAgent()]:::mth
  N18499 --> N18503
  N18504[createAgent()]:::mth
  N18499 --> N18504
  N18505[File: heartbeat.ts]:::file
  N18460 --> N18505
  N18506[Class: HeartbeatClientService]:::cls
  N18505 --> N18506
  N18507[connect()]:::mth
  N18506 --> N18507
  N18508[detectCloudSandboxUrl()]:::mth
  N18506 --> N18508
  N18509[setupEventHandlers()]:::mth
  N18506 --> N18509
  N18510[handleMessage()]:::mth
  N18506 --> N18510
  N18511[updateSystemHealth()]:::mth
  N18506 --> N18511
  N18513[File: websocket.ts]:::file
  N18460 --> N18513
  N18514[Class: WebSocketService]:::cls
  N18513 --> N18514
  N18515[setUrl()]:::mth
  N18514 --> N18515
  N18516[connect()]:::mth
  N18514 --> N18516
  N18517[disconnect()]:::mth
  N18514 --> N18517
  N18518[attemptReconnect()]:::mth
  N18514 --> N18518
  N18519[handleMessage()]:::mth
  N18514 --> N18519
  N18524[File: tailwind.config.ts]:::file
  N18460 --> N18524
  N18525[Class: typography]:::cls
  N18524 --> N18525
  N18527[telegram-mcp]:::pkg
  TNF --> N18527
  N18528[File: agent-push-service.ts]:::file
  N18527 --> N18528
  N18529[Class: AgentPushService]:::cls
  N18528 --> N18529
  N18530[ensureDirectories()]:::mth
  N18529 --> N18530
  N18531[start()]:::mth
  N18529 --> N18531
  N18532[stop()]:::mth
  N18529 --> N18532
  N18533[poll()]:::mth
  N18529 --> N18533
  N18534[handleNewMessage()]:::mth
  N18529 --> N18534
  N18535[virtual-library-blueprints]:::pkg
  TNF --> N18535
  N18550[visualization-hub]:::pkg
  TNF --> N18550
  N18552[vscode-extension]:::pkg
  TNF --> N18552
  N18553[File: EmbeddedBrowserProvider.ts]:::file
  N18552 --> N18553
  N18554[Class: EmbeddedBrowserProvider]:::cls
  N18553 --> N18554
  N18555[resolveWebviewView()]:::mth
  N18554 --> N18555
  N18556[openBrowserPanel()]:::mth
  N18554 --> N18556
  N18557[navigateTo()]:::mth
  N18554 --> N18557
  N18558[goBack()]:::mth
  N18554 --> N18558
  N18559[goForward()]:::mth
  N18554 --> N18559
  N18561[File: config.ts]:::file
  N18552 --> N18561
  N18562[Class: ConfigManager]:::cls
  N18561 --> N18562
  N18563[initialize()]:::mth
  N18562 --> N18563
  N18564[getInstance()]:::mth
  N18562 --> N18564
  N18565[getConfig()]:::mth
  N18562 --> N18565
  N18566[getLLMConfig()]:::mth
  N18562 --> N18566
  N18567[getApiKey()]:::mth
  N18562 --> N18567
  N18571[File: extension.ts]:::file
  N18552 --> N18571
  N18572[Class: ExtensionAPI]:::cls
  N18571 --> N18572
  N18573[getWorkspaceSyncService()]:::mth
  N18572 --> N18573
  N18574[activate()]:::mth
  N18572 --> N18574
  N18575[registerAgent()]:::mth
  N18572 --> N18575
  N18576[sendMessage()]:::mth
  N18572 --> N18576
  N18577[getActiveProvider()]:::mth
  N18572 --> N18577
  N18578[File: ChatViewProvider.ts]:::file
  N18552 --> N18578
  N18579[Class: ChatViewProvider]:::cls
  N18578 --> N18579
  N18580[resolveWebviewView()]:::mth
  N18579 --> N18580
  N18581[handleWebviewMessage()]:::mth
  N18579 --> N18581
  N18582[onWebviewReady()]:::mth
  N18579 --> N18582
  N18583[handleUserMessage()]:::mth
  N18579 --> N18583
  N18584[handleSlashCommand()]:::mth
  N18579 --> N18584
  N18586[File: AIService.ts]:::file
  N18552 --> N18586
  N18587[Class: AIService]:::cls
  N18586 --> N18587
  N18588[getInstance()]:::mth
  N18587 --> N18588
  N18589[initialize()]:::mth
  N18587 --> N18589
  N18590[checkProvider()]:::mth
  N18587 --> N18590
  N18591[updateProviderStatus()]:::mth
  N18587 --> N18591
  N18592[autoSelectProvider()]:::mth
  N18587 --> N18592
  N18593[File: ChatService.ts]:::file
  N18552 --> N18593
  N18594[Class: ChatService]:::cls
  N18593 --> N18594
  N18595[getInstance()]:::mth
  N18594 --> N18595
  N18596[initialize()]:::mth
  N18594 --> N18596
  N18597[getMessages()]:::mth
  N18594 --> N18597
  N18598[addMessage()]:::mth
  N18594 --> N18598
  N18599[sendMessage()]:::mth
  N18594 --> N18599
  N18600[File: MCPDiscoveryService.ts]:::file
  N18552 --> N18600
  N18601[Class: MCPDiscoveryService]:::cls
  N18600 --> N18601
  N18602[getInstance()]:::mth
  N18601 --> N18602
  N18603[getKnownServers()]:::mth
  N18601 --> N18603
  N18604[getServersByCategory()]:::mth
  N18601 --> N18604
  N18605[searchServers()]:::mth
  N18601 --> N18605
  N18606[showServerMarketplace()]:::mth
  N18601 --> N18606
  N18607[File: MCPService.ts]:::file
  N18552 --> N18607
  N18608[Class: MCPService]:::cls
  N18607 --> N18608
  N18609[getInstance()]:::mth
  N18608 --> N18609
  N18610[initialize()]:::mth
  N18608 --> N18610
  N18611[connect()]:::mth
  N18608 --> N18611
  N18612[disconnect()]:::mth
  N18608 --> N18612
  N18613[disconnectAll()]:::mth
  N18608 --> N18613
  N18614[File: MarketplaceService.ts]:::file
  N18552 --> N18614
  N18615[Class: MarketplaceService]:::cls
  N18614 --> N18615
  N18616[getInstance()]:::mth
  N18615 --> N18616
  N18617[getMarketplaceServers()]:::mth
  N18615 --> N18617
  N18618[installServer()]:::mth
  N18615 --> N18618
  N18619[getMarketplaceService()]:::mth
  N18615 --> N18619
  N18620[File: OpenRouterService.ts]:::file
  N18552 --> N18620
  N18621[Class: OpenRouterService]:::cls
  N18620 --> N18621
  N18622[getInstance()]:::mth
  N18621 --> N18622
  N18623[getApiKey()]:::mth
  N18621 --> N18623
  N18624[getBaseUrl()]:::mth
  N18621 --> N18624
  N18625[fetchModels()]:::mth
  N18621 --> N18625
  N18626[getPopularModels()]:::mth
  N18621 --> N18626
  N18627[File: RelayConnectionService.ts]:::file
  N18552 --> N18627
  N18628[Class: RelayConnectionService]:::cls
  N18627 --> N18628
  N18629[getInstance()]:::mth
  N18628 --> N18629
  N18630[connect()]:::mth
  N18628 --> N18630
  N18631[createWebSocket()]:::mth
  N18628 --> N18631
  N18632[disconnect()]:::mth
  N18628 --> N18632
  N18633[register()]:::mth
  N18628 --> N18633
  N18634[File: TemporalIndexerService.ts]:::file
  N18552 --> N18634
  N18635[Class: TemporalIndexerService]:::cls
  N18634 --> N18635
  N18636[getInstance()]:::mth
  N18635 --> N18636
  N18637[initialize()]:::mth
  N18635 --> N18637
  N18638[setupFileWatchers()]:::mth
  N18635 --> N18638
  N18639[indexWorkspace()]:::mth
  N18635 --> N18639
  N18640[updateFileIndex()]:::mth
  N18635 --> N18640
  N18641[File: ToolOrchestrationService.ts]:::file
  N18552 --> N18641
  N18642[Class: ToolOrchestrationService]:::cls
  N18641 --> N18642
  N18643[getInstance()]:::mth
  N18642 --> N18643
  N18644[getAvailableTools()]:::mth
  N18642 --> N18644
  N18645[convertMCPToolsToLLMFormat()]:::mth
  N18642 --> N18645
  N18646[parseToolUses()]:::mth
  N18642 --> N18646
  N18647[executeTools()]:::mth
  N18642 --> N18647
  N18648[File: WorkspaceService.ts]:::file
  N18552 --> N18648
  N18649[Class: WorkspaceService]:::cls
  N18648 --> N18649
  N18650[getInstance()]:::mth
  N18649 --> N18650
  N18651[findFiles()]:::mth
  N18649 --> N18651
  N18652[findTextInFiles()]:::mth
  N18649 --> N18652
  N18653[searchInFile()]:::mth
  N18649 --> N18653
  N18654[createSearchRegex()]:::mth
  N18649 --> N18654
  N18655[File: WorkspaceSyncService.ts]:::file
  N18552 --> N18655
  N18656[Class: WorkspaceSyncService]:::cls
  N18655 --> N18656
  N18657[start()]:::mth
  N18656 --> N18657
  N18658[createMirrorService()]:::mth
  N18656 --> N18658
  N18659[startSync()]:::mth
  N18656 --> N18659
  N18660[stopSync()]:::mth
  N18656 --> N18660
  N18661[toggleSync()]:::mth
  N18656 --> N18661
  N18662[Class: BuiltinWorkspaceMirrorService]:::cls
  N18655 --> N18662
  N18663[start()]:::mth
  N18662 --> N18663
  N18664[createMirrorService()]:::mth
  N18662 --> N18664
  N18665[startSync()]:::mth
  N18662 --> N18665
  N18666[stopSync()]:::mth
  N18662 --> N18666
  N18667[toggleSync()]:::mth
  N18662 --> N18667
  N18669[File: A2AProtocolService.ts]:::file
  N18552 --> N18669
  N18670[Class: A2AProtocolService]:::cls
  N18669 --> N18670
  N18671[getInstance()]:::mth
  N18670 --> N18671
  N18672[getA2AProtocolService()]:::mth
  N18670 --> N18672
  N18673[initialize()]:::mth
  N18670 --> N18673
  N18674[connect()]:::mth
  N18670 --> N18674
  N18675[disconnect()]:::mth
  N18670 --> N18675
  N18676[File: AGUIProtocolService.ts]:::file
  N18552 --> N18676
  N18677[Class: AGUIProtocolService]:::cls
  N18676 --> N18677
  N18678[getInstance()]:::mth
  N18677 --> N18678
  N18679[getAGUIProtocolService()]:::mth
  N18677 --> N18679
  N18680[initialize()]:::mth
  N18677 --> N18680
  N18681[connect()]:::mth
  N18677 --> N18681
  N18682[disconnect()]:::mth
  N18677 --> N18682
  N18683[File: AgentRegistryService.ts]:::file
  N18552 --> N18683
  N18684[Class: AgentRegistryService]:::cls
  N18683 --> N18684
  N18685[getInstance()]:::mth
  N18684 --> N18685
  N18686[getAgentRegistryService()]:::mth
  N18684 --> N18686
  N18687[initialize()]:::mth
  N18684 --> N18687
  N18688[registerAgent()]:::mth
  N18684 --> N18688
  N18689[getAgent()]:::mth
  N18684 --> N18689
  N18690[File: CollectiveOrchestratorService.ts]:::file
  N18552 --> N18690
  N18691[Class: CollectiveOrchestratorService]:::cls
  N18690 --> N18691
  N18692[getInstance()]:::mth
  N18691 --> N18692
  N18693[getCollectiveOrchestratorService()]:::mth
  N18691 --> N18693
  N18694[initialize()]:::mth
  N18691 --> N18694
  N18695[showOrchestrator()]:::mth
  N18691 --> N18695
  N18696[distributeTask()]:::mth
  N18691 --> N18696
  N18697[File: MemoryBankService.ts]:::file
  N18552 --> N18697
  N18698[Class: MemoryBankService]:::cls
  N18697 --> N18698
  N18699[getInstance()]:::mth
  N18698 --> N18699
  N18700[getMemoryBankService()]:::mth
  N18698 --> N18700
  N18701[initialize()]:::mth
  N18698 --> N18701
  N18702[showMemoryBank()]:::mth
  N18698 --> N18702
  N18703[showActiveContext()]:::mth
  N18698 --> N18703
  N18704[Class: citizens]:::cls
  N18697 --> N18704
  N18705[getInstance()]:::mth
  N18704 --> N18705
  N18706[getMemoryBankService()]:::mth
  N18704 --> N18706
  N18707[initialize()]:::mth
  N18704 --> N18707
  N18708[showMemoryBank()]:::mth
  N18704 --> N18708
  N18709[showActiveContext()]:::mth
  N18704 --> N18709
  N18710[File: ProtocolTranslationService.ts]:::file
  N18552 --> N18710
  N18711[Class: ProtocolTranslationService]:::cls
  N18710 --> N18711
  N18712[getInstance()]:::mth
  N18711 --> N18712
  N18713[getProtocolTranslationService()]:::mth
  N18711 --> N18713
  N18714[initialize()]:::mth
  N18711 --> N18714
  N18715[translateMessage()]:::mth
  N18711 --> N18715
  N18716[translateTool()]:::mth
  N18711 --> N18716
  N18717[File: RelayServerService.ts]:::file
  N18552 --> N18717
  N18718[Class: RelayServerService]:::cls
  N18717 --> N18718
  N18719[loadRedisAgentClient()]:::mth
  N18718 --> N18719
  N18720[getInstance()]:::mth
  N18718 --> N18720
  N18721[getRelayServerService()]:::mth
  N18718 --> N18721
  N18722[initialize()]:::mth
  N18718 --> N18722
  N18723[connect()]:::mth
  N18718 --> N18723
  N18727[File: logger.ts]:::file
  N18552 --> N18727
  N18728[Class: Logger]:::cls
  N18727 --> N18728
  N18729[getInstance()]:::mth
  N18728 --> N18729
  N18730[setLevel()]:::mth
  N18728 --> N18730
  N18731[shouldLog()]:::mth
  N18728 --> N18731
  N18732[formatMessage()]:::mth
  N18728 --> N18732
  N18733[log()]:::mth
  N18728 --> N18733
  N18734[zeroclaw-sandbox]:::pkg
  TNF --> N18734
```
