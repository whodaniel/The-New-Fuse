import { SetMetadata } from '@nestjs/common';
import { applyDecorators } from '@nestjs/common';

export const CASCADE_ON_DELETE = 'cascade_on_delete';

export function CascadeOnDelete(): any {
    return applyDecorators(
        SetMetadata(CASCADE_ON_DELETE, true)
    );
}
