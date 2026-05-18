import { prisma } from './prisma'

export async function createAuditLog({
  entity,
  entityId,
  action,
  actorId,
  before,
  after,
}: {
  entity: string
  entityId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  actorId: string
  before?: unknown
  after?: unknown
}) {
  await prisma.auditLog.create({
    data: {
      entity,
      entityId,
      action,
      actorId,
      beforeJson: before ? JSON.stringify(before) : null,
      afterJson: after ? JSON.stringify(after) : null,
    },
  })
}
