import { NextRequest, NextResponse } from 'next/server';
import { FastIntakeSchema } from '@/shared/contracts/api-contracts';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { createProblemResponse } from '@/shared/errors/problem-details';
import { asPoskoId } from '@/core/shared/branded-types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const poskoId = searchParams.get('poskoId') || 'posko-demo-001';
    const container = ServiceContainer.getInstance();

    const result = await container.refugeeRepo.findByPoskoId(asPoskoId(poskoId));
    if (!result.ok) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/db-query-failed',
        title: 'Gagal Membaca Data Pengungsi',
        status: 500,
        detail: result.error.message,
        code: result.error.code,
      });
    }

    const snapshots = result.value.map((r) => r.toSnapshot());
    return NextResponse.json({
      success: true,
      count: snapshots.length,
      data: snapshots,
    });
  } catch (error) {
    return createProblemResponse({
      type: 'https://sanidya.id/errors/server-error',
      title: 'Kesalahan Server Internal',
      status: 500,
      detail: (error as Error).message,
      code: 'SERVER_ERROR',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = FastIntakeSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/invalid-input',
        title: 'Format Input Pendaftaran Tidak Valid',
        status: 422,
        detail: 'Data input pendaftaran warga tidak memenuhi validasi skema.',
        code: 'VALIDATION_FAILED',
        invalidParams: parseResult.error.issues.map((i) => ({
          field: i.path.join('.'),
          reason: i.message,
        })),
      });
    }

    const data = parseResult.data;
    const container = ServiceContainer.getInstance();
    const result = await container.fastIntakeUseCase.execute({
      poskoId: data.posId,
      fullName: data.fullName,
      nationalId: data.nationalId,
      gender: data.gender,
      age: data.age,
      domicileOrigin: data.domicileOrigin,
      shelterLocation: data.shelterLocation,
      missingKinName: data.missingKinName,
      urgentNeeds: data.urgentNeeds,
      vulnerabilities: data.vulnerabilities,
      registeredByUserId: req.headers.get('x-user-id') || 'system-registrar',
    });

    if (!result.ok) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/intake-failed',
        title: 'Pendaftaran Gagal Diproses',
        status: result.error.status || 400,
        detail: result.error.message,
        code: result.error.code,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: result.value,
      },
      { status: 201 }
    );
  } catch (error) {
    return createProblemResponse({
      type: 'https://sanidya.id/errors/server-error',
      title: 'Kesalahan Server Internal',
      status: 500,
      detail: (error as Error).message,
      code: 'SERVER_ERROR',
    });
  }
}
