#!/bin/bash

# Create new directory structure
mkdir -p packages/{core,database,shared}/{src,test}
mkdir -p packages/shared/{types,utils,ui}
mkdir -p apps/{api,frontend}/{src,test}
mkdir -p docker
mkdir -p scripts

# Move files to their new locations
mv src/llm packages/core/src/
mv src/innovation packages/core/src/
mv src/database packages/database/src/
mv src/utils packages/shared/utils/src/
mv src/types packages/shared/types/src/
mv src/ui packages/shared/ui/src/

# Update package.json files
for dir in packages/*/ apps/*/; do
    if [ ! -f "$dir/package.json" ]; then
        cp package.json.template "$dir/package.json"
        # Update package name and dependencies
        sed -i "s/PACKAGE_NAME/$(basename $dir)/" "$dir/package.json"
    fi
done

# Move Docker files
mv Dockerfile docker/Dockerfile.base
mv docker-compose.yml docker/

echo "Project restructuring complete"