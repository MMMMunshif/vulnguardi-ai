import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  const department = {
    id: 'department-1',
    name: 'Security Operations',
    organizationId: 'org-1',
    users: [],
  };
  const createDto = {
    name: department.name,
    description: 'Security monitoring team',
    organizationId: department.organizationId,
  };
  const prisma = {
    department: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: { findUnique: jest.fn() },
  };

  let service: DepartmentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DepartmentsService(prisma as unknown as PrismaService);
  });

  it('scopes department listings to the authenticated organization', async () => {
    prisma.department.findMany.mockResolvedValue([department]);

    await expect(service.findAll('org-1')).resolves.toEqual({
      message: 'Departments fetched successfully',
      departments: [department],
    });
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org-1' } }),
    );
  });

  it('uses tenant scope when fetching one department', async () => {
    prisma.department.findFirst.mockResolvedValue(department);

    await service.findOne('department-1', 'org-1');

    expect(prisma.department.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'department-1', organizationId: 'org-1' },
      }),
    );
  });

  it('returns not found for an inaccessible department', async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(service.findOne('department-1', 'org-2')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects creating a department for another organization', async () => {
    await expect(service.create(createDto, 'org-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it('prevents duplicate department names within an organization', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.department.findFirst.mockResolvedValue(department);

    await expect(service.create(createDto, 'org-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.department.create).not.toHaveBeenCalled();
  });

  it('creates a department inside a valid organization', async () => {
    prisma.organization.findUnique.mockResolvedValue({ id: 'org-1' });
    prisma.department.findFirst.mockResolvedValue(null);
    prisma.department.create.mockResolvedValue(department);

    await expect(service.create(createDto, 'org-1')).resolves.toEqual({
      message: 'Department created successfully',
      department,
    });
    expect(prisma.department.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: createDto }),
    );
  });

  it('rejects updating a department outside the tenant', async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(
      service.update('department-1', { description: 'Changed' }, 'org-2'),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.department.update).not.toHaveBeenCalled();
  });

  it('prevents renaming a department to a duplicate tenant name', async () => {
    prisma.department.findFirst
      .mockResolvedValueOnce(department)
      .mockResolvedValueOnce({ ...department, id: 'department-2' });

    await expect(
      service.update(
        'department-1',
        { name: 'IT Operations' },
        'org-1',
      ),
    ).rejects.toThrow(ConflictException);
    expect(prisma.department.findFirst).toHaveBeenLastCalledWith({
      where: {
        name: 'IT Operations',
        organizationId: 'org-1',
        NOT: { id: 'department-1' },
      },
    });
  });

  it('updates an available department name', async () => {
    const updated = { ...department, name: 'IT Operations' };
    prisma.department.findFirst
      .mockResolvedValueOnce(department)
      .mockResolvedValueOnce(null);
    prisma.department.update.mockResolvedValue(updated);

    await expect(
      service.update(
        'department-1',
        { name: updated.name },
        'org-1',
      ),
    ).resolves.toEqual({
      message: 'Department updated successfully',
      department: updated,
    });
  });

  it('prevents deleting a department with assigned users', async () => {
    prisma.department.findFirst.mockResolvedValue({
      ...department,
      users: [{ id: 'user-1' }],
    });

    await expect(service.remove('department-1', 'org-1')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.department.delete).not.toHaveBeenCalled();
  });

  it('deletes an empty department inside the tenant', async () => {
    prisma.department.findFirst.mockResolvedValue(department);
    prisma.department.delete.mockResolvedValue(department);

    await expect(service.remove('department-1', 'org-1')).resolves.toEqual({
      message: 'Department deleted successfully',
    });
    expect(prisma.department.findFirst).toHaveBeenCalledWith({
      where: { id: 'department-1', organizationId: 'org-1' },
      include: { users: true },
    });
    expect(prisma.department.delete).toHaveBeenCalledWith({
      where: { id: 'department-1' },
    });
  });
});
