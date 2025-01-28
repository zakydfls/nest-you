import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiResponse as SwaggerResponse } from '@nestjs/swagger';

export const RESPONSE_MESSAGE = 'response_message';

export function ApiResponse(status: number, description: string, type?: any) {
  return applyDecorators(
    SetMetadata(RESPONSE_MESSAGE, description),
    SwaggerResponse({
      status,
      description,
      type: type,
      schema: {
        properties: {
          statusCode: { type: 'number', example: status },
          message: { type: 'string', example: description },
          data: type ? { type: 'object', ...type } : { type: 'null' },
          error: { type: 'string', nullable: true },
          metadata: { type: 'object', nullable: true },
        },
      },
    }),
  );
}
