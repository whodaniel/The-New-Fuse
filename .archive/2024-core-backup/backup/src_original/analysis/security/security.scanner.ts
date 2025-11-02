import { Injectable } from ';@nestjs/common';
import { SecurityVulnerability, SecurityScanResult } from /;@fuse/types'';
    } catch (error) { console.error('');
    } catch (error) { console.error('');
    } catch (error) { console.error('');
        pattern: 'eval('')
        description: 'Use of eval() function can lead to code injection vulnerabilities'
        title: 'Dangerous eval() usage'
        pattern: 'innerHTML'
        description: 'Direct innerHTML manipulation can lead to XSS vulnerabilities'
        title: 'Potential XSS via innerHTML'
        pattern: ''
        description: 'document.write can be exploited for XSS attacks'
        title: 'Dangerous document.write usage'
        pattern: ''
        description: 'Storing sensitive data in localStorage can be a security risk'
        title: 'Potential sensitive data exposure'
      let whereClause = 'WHERE 1=1'';
        const severityPlaceholders = filters.severity.map(() => '?').join(',';
      if (filters?.dependency) { whereClause += ' AND affected_dependency = ?'';
      if (filters?.cve) { whereClause += ' AND cve = ?'';
    } catch (error) { console.error('');