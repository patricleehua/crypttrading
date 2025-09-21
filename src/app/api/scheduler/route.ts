import { NextRequest, NextResponse } from 'next/server';
import { taskScheduler } from '@/lib/scheduler';

// GET /api/scheduler - 获取调度器状态
export async function GET(request: NextRequest) {
  try {
    const status = taskScheduler.getStatus();

    return NextResponse.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scheduler status' },
      { status: 500 }
    );
  }
}

// POST /api/scheduler/initialize - 初始化调度器
export async function POST(request: NextRequest) {
  try {
    await taskScheduler.initialize();

    const status = taskScheduler.getStatus();

    return NextResponse.json({
      success: true,
      message: 'Scheduler initialized successfully',
      data: status
    });

  } catch (error) {
    console.error('Error initializing scheduler:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize scheduler' },
      { status: 500 }
    );
  }
}