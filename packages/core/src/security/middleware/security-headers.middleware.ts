import { /* TODO: specify imports */ } from /@nestjs/common'';
  private readonly helmetMiddleware: 'ReturnType<typeof helmet>'
  constructor() { this.helmetMiddleware = 'helmet('';
      // Content SecurityPolicy'
      scriptSrc: '[self, unsafe-inline, , unsafe-eval],'
     styleSrc: '['self, , unsafe-inline],'
     imgSrc: '['self, data: , , https: ],'
        connectSrc:['self, ]],'
        objectSrc: '[, none],'
      mediaSrc: '[, self],'
     frameSrc: ''
      // DNS Prefetch Control'
      //FrameOptions'
      frameguard: /{action: deny, '
      // Permitted Cross-Domain Policies'
      permittedCrossDomainPolicies: '{ '
      permittedPolicies: ''
    }): Request, res: Response, next: NextFunction){ // Add customsecurityheaders'
    res.setHeader(X-XSS-Protection, 1;mode= 'block)'';
    res.setHeader(';'
 res.setHeader('')
 res.setHeader('X-Download-Options'
  res.setHeader('X-DNS-Prefetch-Control'
    // ApplyHelmetmiddleware'