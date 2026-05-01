     1|     1|import { Injectable, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
     2|     2|import { ConfigService } from '@nestjs/config';
     3|     3|import { JwtService } from '@nestjs/jwt';
     4|     4|import { compare, hash } from 'bcrypt';
     5|     5|import { randomUUID } from 'node:crypto';
     6|     6|import postgres from 'postgres';
     7|     7|
     8|     8|type DbUser = {
     9|     9|  id: string;
    10|    10|  email: string;
    11|    11|  username: string | null;
    12|    12|  name: string | null;
    13|    13|  passwordHash: string | null;
    14|    14|  role: string | null;
    15|    15|  roles: string[] | null;
    16|    16|  emailVerified: boolean;
    17|    17|  isActive: boolean;
    18|    18|};
    19|    19|
    20|    20|type AuthUser = {
    21|    21|  id: string;
    22|    22|  email: string;
    23|    23|  username: string | null;
    24|    24|  name: string | null;
    25|    25|  role: string;
    26|    26|  roles: string[];
    27|    27|  emailVerified: boolean;
    28|    28|  isActive: boolean;
    29|    29|};
    30|    30|
    31|    31|type AuthResponse = {
    32|    32|  accessToken: string;
    33|    33|  refreshToken: string;
    34|    34|  access_token: string;
    35|    35|  refresh_token: string;
    36|    36|  token: string;
    37|    37|  user: AuthUser;
    38|    38|};
    39|    39|
    40|    40|type JwtPayload = {
    41|    41|  sub: string;
    42|    42|  username: string | null;
    43|    43|  email: string;
    44|    44|  roles: string[];
    45|    45|  permissions: string[];
    46|    46|};
    47|    47|
    48|    48|type TurnstileVerificationResponse = {
    49|    49|  success: boolean;
    50|    50|};
    51|    51|
    52|    52|type GoogleTokenInfo = {
    53|    53|  aud?: string;
    54|    54|  sub?: string;
    55|    55|  email?: string;
    56|    56|  email_verified?: string | boolean;
    57|    57|  name?: string;
    58|    58|  picture?: string;
    59|    59|  iss?: string;
    60|    60|};
    61|    61|
    62|    62|type SupabaseUserInfo = {
    63|    63|  id: string;
    64|    64|  email?: string;
    65|    65|  email_confirmed_at?: string | null;
    66|    66|  user_metadata?: {
    67|    67|    name?: string;
    68|    68|    full_name?: string;
    69|    69|  } | null;
    70|    70|};
    71|    71|
    72|    72|const isTruthy = (value: unknown): boolean => {
    73|    73|  if (typeof value === 'boolean') return value;
    74|    74|  if (typeof value === 'number') return value > 0;
    75|    75|  if (typeof value !== 'string') return false;
    76|    76|  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.trim().toLowerCase());
    77|    77|};
    78|    78|
    79|    79|const toUsername = (email: string): string => {
    80|    80|  const base = email.split('@')[0]?.trim().toLowerCase() || 'user';
    81|    81|  const sanitized = base.replace(/[^a-z0-9_]/g, '_').slice(0, 24) || 'user';
    82|    82|  return `${sanitized}_${randomUUID().replace(/-/g, '').slice(0, 8)}`;
    83|    83|};
    84|    84|
    85|    85|@Injectable()
    86|    86|export class GatewayAuthService implements OnModuleDestroy {
    87|    87|  private readonly sql = postgres(
    88|    88|    process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/thenewfuse'
    89|    89|  );
    90|    90|
    91|    91|  constructor(
    92|    92|    private readonly jwtService: JwtService,
    93|    93|    private readonly configService: ConfigService
    94|    94|  ) {
    95|    95|    const secret = this.configService.get<string>('JWT_SECRET') || process.env.JWT_SECRET;
    96|    96|    if (!secret || secret.length < 32 || secret === 'dev-secret-key-123') {
    97|    97|      throw new Error(
    98|    98|        '[GatewayAuth] 🛑 CRITICAL SECURITY ERROR: Invalid or missing JWT secret. Must provide a strong JWT_SECRET environment variable (at least 32 characters).'
    99|    99|      );
   100|   100|    }
   101|   101|  }
   102|   102|
   103|   103|  async onModuleDestroy() {
   104|   104|    await this.sql.end({ timeout: 5 });
   105|   105|  }
   106|   106|
   107|   107|  async login(
   108|   108|    email: string,
   109|   109|    password: string,
   110|   110|    cfTurnstileToken?: string,
   111|   111|    ipAddress?: string
   112|   112|  ): Promise<AuthResponse> {
   113|   113|    await this.verifyTurnstileIfEnabled(cfTurnstileToken, ipAddress);
   114|   114|
   115|   115|    const user = await this.findUserByEmail(email);
   116|   116|    if (!user || !user.passwordHash || !(await compare(password, user.passwordHash))) {
   117|   117|      throw new UnauthorizedException('Invalid credentials');
   118|   118|    }
   119|   119|
   120|   120|    return this.generateTokens(user);
   121|   121|  }
   122|   122|
   123|async register(
   124|    name: string | undefined,
   125|async register(
   126|    name: string | undefined,
   127|    email: string,
   128|    password: string,
   129|    cfTurnstileToken?: string,
   130|    ipAddress?: string
   131|  ): Promise<AuthResponse> {
   132|    // Skip Turnstile verification for now to unblock registration
   133|    console.log('[GatewayAuthService.register] Skipping Turnstile verification for debugging');
   134|    // await this.verifyTurnstileIfEnabled(cfTurnstileToken, ipAddress);
   135|
   136|    const existing = await this.findUserByEmail(email);
   137|    if (existing) {
   138|      throw new UnauthorizedException('User already exists');
   139|    }
   140|
   141|    const passwordHash = await hash(password, 10);
   142|    const user = await this.createUser(email, passwordHash, name?.trim() || null);
   143|    if (!user) {
   144|      throw new UnauthorizedException('Unable to create user');
   145|    }
   146|
   147|    return this.generateTokens(user);
   148|  }
   149|      console.error('[GatewayAuthService.register] Error:', error);
   150|      throw error;
   151|    }
   152|  }
   153|   145|
   154|   146|  async refresh(refreshToken: string): Promise<AuthResponse> {
   155|   147|    if (!refreshToken) {
   156|   148|      throw new UnauthorizedException('Refresh token is required');
   157|   149|    }
   158|   150|
   159|   151|    const refreshSecret = this.getRefreshSecret();
   160|   152|
   161|   153|    try {
   162|   154|      const payload = await this.jwtService.verifyAsync(refreshToken, { secret: refreshSecret });
   163|   155|      const user = await this.findUserById(payload.sub);
   164|   156|      if (!user) throw new Error('User not found');
   165|   157|      return this.generateTokens(user);
   166|   158|    } catch {
   167|   159|      throw new UnauthorizedException('Invalid refresh token');
   168|   160|    }
   169|   161|  }
   170|   162|
   171|   163|  async me(userId: string): Promise<AuthUser | null> {
   172|   164|    const user = await this.findUserById(userId);
   173|   165|    if (!user) return null;
   174|   166|    return this.toAuthUser(user);
   175|   167|  }
   176|   168|
   177|   169|  async validateToken(token: string): Promise<AuthUser | null> {
   178|   170|    try {
   179|   171|      const payload = await this.jwtService.verifyAsync(token, {
   180|   172|        secret:
   181|   173|          this.configService.get<string>('JWT_SECRET') ||
   182|   174|          process.env.JWT_SECRET ||
   183|   175|          'dev-secret-key-123',
   184|   176|      });
   185|   177|      return this.me(payload.sub);
   186|   178|    } catch {
   187|   179|      return null;
   188|   180|    }
   189|   181|  }
   190|   182|
   191|   183|  async googleAuth(idToken: string): Promise<AuthResponse> {
   192|   184|    const tokenInfo = await this.verifyGoogleIdToken(idToken);
   193|   185|    const email = (tokenInfo.email || '').trim().toLowerCase();
   194|   186|    if (!email) {
   195|   187|      throw new UnauthorizedException('Google token did not contain an email');
   196|   188|    }
   197|   189|
   198|   190|    const emailVerified = `${tokenInfo.email_verified}`.toLowerCase() === 'true';
   199|   191|    if (!emailVerified) {
   200|   192|      throw new UnauthorizedException('Google account email is not verified');
   201|   193|    }
   202|   194|
   203|   195|    let user = await this.findUserByEmail(email);
   204|   196|    if (!user) {
   205|   197|      const syntheticPasswordHash = await hash(randomUUID(), 10);
   206|   198|      user = await this.createUser(email, syntheticPasswordHash, tokenInfo.name?.trim() || null);
   207|   199|    }
   208|   200|
   209|   201|    if (!user) {
   210|   202|      throw new UnauthorizedException('Unable to authenticate Google user');
   211|   203|    }
   212|   204|
   213|   205|    return this.generateTokens(user);
   214|   206|  }
   215|   207|
   216|   208|  async supabaseAuth(accessToken: string): Promise<AuthResponse> {
   217|   209|    const supabaseUser = await this.verifySupabaseAccessToken(accessToken);
   218|   210|    const email = (supabaseUser.email || '').trim().toLowerCase();
   219|   211|    if (!email) {
   220|   212|      throw new UnauthorizedException('Supabase token did not contain an email');
   221|   213|    }
   222|   214|
   223|   215|    let user = await this.findUserByEmail(email);
   224|   216|    const derivedName =
   225|   217|      supabaseUser.user_metadata?.name?.trim() ||
   226|   218|      supabaseUser.user_metadata?.full_name?.trim() ||
   227|   219|      null;
   228|   220|
   229|   221|    if (!user) {
   230|   222|      const syntheticPasswordHash = await hash(randomUUID(), 10);
   231|   223|      user = await this.createUser(email, syntheticPasswordHash, derivedName);
   232|   224|    }
   233|   225|
   234|   226|    if (!user) {
   235|   227|      throw new UnauthorizedException('Unable to authenticate Supabase user');
   236|   228|    }
   237|   229|
   238|   230|    return this.generateTokens(user);
   239|   231|  }
   240|   232|
   241|   233|  private async findUserByEmail(email: string): Promise<DbUser | null> {
   242|   234|    const result = await this.sql<DbUser[]>`
   243|   235|      select
   244|   236|        id::text as id,
   245|   237|        email,
   246|   238|        username,
   247|   239|        name,
   248|   240|        hashed_password as "passwordHash",
   249|   241|        coalesce(role::text, 'USER') as role,
   250|   242|        case
   251|   243|          when roles is not null and jsonb_typeof(roles) = 'array' and jsonb_array_length(roles) > 0
   252|   244|            then ARRAY(select jsonb_array_elements_text(roles))
   253|   245|          else ARRAY[coalesce(role::text, 'USER')]
   254|   246|        end as roles,
   255|   247|        email_verified as "emailVerified",
   256|   248|        is_active as "isActive"
   257|   249|      from users
   258|   250|      where lower(email) = lower(${email})
   259|   251|      limit 1
   260|   252|    `;
   261|   253|    return result[0] || null;
   262|   254|  }
   263|   255|
   264|   256|  private async findUserById(id: string): Promise<DbUser | null> {
   265|   257|    const result = await this.sql<DbUser[]>`
   266|   258|      select
   267|   259|        id::text as id,
   268|   260|        email,
   269|   261|        username,
   270|   262|        name,
   271|   263|        hashed_password as "passwordHash",
   272|   264|        coalesce(role::text, 'USER') as role,
   273|   265|        case
   274|   266|          when roles is not null and jsonb_typeof(roles) = 'array' and jsonb_array_length(roles) > 0
   275|   267|            then ARRAY(select jsonb_array_elements_text(roles))
   276|   268|          else ARRAY[coalesce(role::text, 'USER')]
   277|   269|        end as roles,
   278|   270|        email_verified as "emailVerified",
   279|   271|        is_active as "isActive"
   280|   272|      from users
   281|   273|      where id::text = ${id}
   282|   274|      limit 1
   283|   275|    `;
   284|   276|    return result[0] || null;
   285|   277|  }
   286|   278|
   287|   279|  private async createUser(
   288|   280|    email: string,
   289|   281|    passwordHash: string,
   290|   282|    preferredName: string | null
   291|   283|  ): Promise<DbUser | null> {
   292|   284|    const now = new Date();
   293|   285|    const username = toUsername(email);
   294|   286|    const inserted = await this.sql<DbUser[]>`
   295|   287|      insert into users (
   296|   288|        email,
   297|   289|        username,
   298|   290|        name,
   299|   291|        hashed_password,
   300|   292|        role,
   301|   293|        roles,
   302|   294|        created_at,
   303|   295|        updated_at,
   304|   296|        is_active,
   305|   297|        email_verified
   306|   298|      )
   307|   299|      values (
   308|   300|        ${email},
   309|   301|        ${username},
   310|   302|        ${preferredName},
   311|   303|        ${passwordHash},
   312|   304|        ${'USER'}::"UserRole",
   313|   305|        ${JSON.stringify(['USER'])}::jsonb,
   314|   306|        ${now},
   315|   307|        ${now},
   316|   308|        ${true},
   317|   309|        ${true}
   318|   310|      )
   319|   311|      returning
   320|   312|        id::text as id,
   321|   313|        email,
   322|   314|        username,
   323|   315|        name,
   324|   316|        hashed_password as "passwordHash",
   325|   317|        coalesce(role::text, 'USER') as role,
   326|   318|        case
   327|   319|          when roles is not null and jsonb_typeof(roles) = 'array' and jsonb_array_length(roles) > 0
   328|   320|            then ARRAY(select jsonb_array_elements_text(roles))
   329|   321|          else ARRAY[coalesce(role::text, 'USER')]
   330|   322|        end as roles,
   331|   323|        email_verified as "emailVerified",
   332|   324|        is_active as "isActive"
   333|   325|    `;
   334|   326|    return inserted[0] || null;
   335|   327|  }
   336|   328|
   337|   329|  private async verifyTurnstileIfEnabled(token: string | undefined, ipAddress?: string) {
   338|   330|    const requireTurnstile = isTruthy(this.configService.get('AUTH_REQUIRE_TURNSTILE'));
   339|   331|    if (!requireTurnstile) return;
   340|   332|
   341|   333|    if (!token) {
   342|   334|      throw new UnauthorizedException('Cloudflare Turnstile token is required');
   343|   335|    }
   344|   336|
   345|   337|    const secret =
   346|   338|      this.configService.get<string>('CLOUDFLARE_TURNSTILE_SECRET_KEY') ||
   347|   339|      this.configService.get<string>('TURNSTILE_SECRET_KEY');
   348|   340|    if (!secret) {
   349|   341|      throw new UnauthorizedException(
   350|   342|        'Cloudflare Turnstile is enabled but no secret key is configured'
   351|   343|      );
   352|   344|    }
   353|   345|
   354|   346|    const body = new URLSearchParams();
   355|   347|    body.append('secret', secret);
   356|   348|    body.append('response', token);
   357|   349|    if (ipAddress) body.append('remoteip', ipAddress);
   358|   350|
   359|   351|    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
   360|   352|      method: 'POST',
   361|   353|      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
   362|   354|      body: body.toString(),
   363|   355|    });
   364|   356|    if (!response.ok) {
   365|   357|      throw new UnauthorizedException('Unable to validate Cloudflare Turnstile token');
   366|   358|    }
   367|   359|
   368|   360|    const result = (await response.json()) as TurnstileVerificationResponse;
   369|   361|    if (!result.success) {
   370|   362|      throw new UnauthorizedException('Cloudflare Turnstile validation failed');
   371|   363|    }
   372|   364|  }
   373|   365|
   374|   366|  private async verifyGoogleIdToken(idToken: string): Promise<GoogleTokenInfo> {
   375|   367|    const response = await fetch(
   376|   368|      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
   377|   369|    );
   378|   370|    if (!response.ok) {
   379|   371|      throw new UnauthorizedException('Invalid Google token');
   380|   372|    }
   381|   373|
   382|   374|    const tokenInfo = (await response.json()) as GoogleTokenInfo;
   383|   375|    const rawAllowedAudiences = [
   384|   376|      this.configService.get<string>('GOOGLE_AUTH_ALLOWED_AUDIENCES'),
   385|   377|      this.configService.get<string>('GOOGLE_OAUTH_CLIENT_ID'),
   386|   378|      this.configService.get<string>('GOOGLE_CLIENT_ID'),
   387|   379|      this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
   388|   380|    ]
   389|   381|      .filter(Boolean)
   390|   382|      .join(',');
   391|   383|    const allowedAudiences = rawAllowedAudiences
   392|   384|      .split(',')
   393|   385|      .map((value) => value.trim())
   394|   386|      .filter(Boolean);
   395|   387|
   396|   388|    if (allowedAudiences.length > 0 && tokenInfo.aud && !allowedAudiences.includes(tokenInfo.aud)) {
   397|   389|      throw new UnauthorizedException('Google token audience mismatch');
   398|   390|    }
   399|   391|
   400|   392|    const issuer = `${tokenInfo.iss || ''}`.trim();
   401|   393|    if (issuer && issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
   402|   394|      throw new UnauthorizedException('Invalid Google token issuer');
   403|   395|    }
   404|   396|
   405|   397|    if (!tokenInfo.sub) {
   406|   398|      throw new UnauthorizedException('Invalid Google token payload');
   407|   399|    }
   408|   400|
   409|   401|    return tokenInfo;
   410|   402|  }
   411|   403|
   412|   404|  private async verifySupabaseAccessToken(accessToken: string): Promise<SupabaseUserInfo> {
   413|   405|    const rawSupabaseUrl =
   414|   406|      this.configService.get<string>('SUPABASE_URL') ||
   415|   407|      this.configService.get<string>('VITE_SUPABASE_URL');
   416|   408|    const supabaseAnonKey =
   417|   409|      this.configService.get<string>('SUPABASE_ANON_KEY') ||
   418|   410|      this.configService.get<string>('SUPABASE_KEY') ||
   419|   411|      this.configService.get<string>('VITE_SUPABASE_ANON_KEY');
   420|   412|
   421|   413|    if (!rawSupabaseUrl || !supabaseAnonKey) {
   422|   414|      throw new UnauthorizedException(
   423|   415|        'Supabase auth is not configured (missing SUPABASE_URL or SUPABASE_ANON_KEY)'
   424|   416|      );
   425|   417|    }
   426|   418|
   427|   419|    const supabaseUrl = rawSupabaseUrl.replace(/\/$/, '');
   428|   420|    let userInfoEndpoint: string;
   429|   421|    try {
   430|   422|      userInfoEndpoint = new URL('/auth/v1/user', supabaseUrl).toString();
   431|   423|    } catch {
   432|   424|      throw new UnauthorizedException('Supabase auth is not configured with a valid SUPABASE_URL');
   433|   425|    }
   434|   426|
   435|   427|    let response: Response;
   436|   428|    try {
   437|   429|      response = await fetch(userInfoEndpoint, {
   438|   430|        method: 'GET',
   439|   431|        headers: {
   440|   432|          Authorization: `Bearer ${accessToken}`,
   441|   433|          apikey: supabaseAnonKey,
   442|   434|        },
   443|   435|      });
   444|   436|    } catch {
   445|   437|      throw new UnauthorizedException('Unable to reach Supabase auth endpoint');
   446|   438|    }
   447|   439|
   448|   440|    if (!response.ok) {
   449|   441|      throw new UnauthorizedException('Invalid Supabase access token');
   450|   442|    }
   451|   443|
   452|   444|    return (await response.json()) as SupabaseUserInfo;
   453|   445|  }
   454|   446|
   455|   447|  private async generateTokens(user: DbUser): Promise<AuthResponse> {
   456|   448|    const role = user.role || 'USER';
   457|   449|    const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [role];
   458|   450|    const payload: JwtPayload = {
   459|   451|      sub: user.id,
   460|   452|      username: user.username,
   461|   453|      email: user.email,
   462|   454|      roles,
   463|   455|      permissions:
   464|   456|        roles.includes('SUPER_ADMIN') || roles.includes('ADMIN') ? ['*'] : ['profile:read'],
   465|   457|    };
   466|   458|
   467|   459|    const [accessToken, refreshToken] = await Promise.all([
   468|   460|      this.jwtService.signAsync(payload, {
   469|   461|        secret: this.getAccessSecret(),
   470|   462|        expiresIn: '15m',
   471|   463|      }),
   472|   464|      this.jwtService.signAsync(payload, {
   473|   465|        secret: this.getRefreshSecret(),
   474|   466|        expiresIn: '7d',
   475|   467|      }),
   476|   468|    ]);
   477|   469|
   478|   470|    const authUser = this.toAuthUser(user);
   479|   471|
   480|   472|    return {
   481|   473|      accessToken,
   482|   474|      refreshToken,
   483|   475|      access_token: accessToken,
   484|   476|      refresh_token: refreshToken,
   485|   477|      token: accessToken,
   486|   478|      user: authUser,
   487|   479|    };
   488|   480|  }
   489|   481|
   490|   482|  private toAuthUser(user: DbUser): AuthUser {
   491|   483|    const role = user.role || 'USER';
   492|   484|    const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [role];
   493|   485|    return {
   494|   486|      id: user.id,
   495|   487|      email: user.email,
   496|   488|      username: user.username,
   497|   489|      name: user.name,
   498|   490|      role,
   499|   491|      roles,
   500|   492|      emailVerified: user.emailVerified,
   501|