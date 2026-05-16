// .pnpmfile.cjs
function readPackage(pkg, context) {
  if (!pkg.name) return pkg;
  // Force all NestJS core packages to 11.1.17 to avoid version mismatches
  if (pkg.name.startsWith('@nestjs/')) {
    if (pkg.dependencies && pkg.dependencies['@nestjs/common']) {
      pkg.dependencies['@nestjs/common'] = '11.1.17';
    }
    if (pkg.dependencies && pkg.dependencies['@nestjs/core']) {
      pkg.dependencies['@nestjs/core'] = '11.1.17';
    }
  }

  // Force Drizzle ORM to 0.40.1 across the entire workspace to avoid "separate declarations" errors
  if (pkg.dependencies && pkg.dependencies['drizzle-orm']) {
    pkg.dependencies['drizzle-orm'] = '0.40.1';
  }
  if (pkg.peerDependencies && pkg.peerDependencies['drizzle-orm']) {
    pkg.peerDependencies['drizzle-orm'] = '0.40.1';
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};
