import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. 테스트 사용자 생성
  const testUser = await prisma.user.upsert({
    where: { email: 'test@gmail.com' },
    update: {},
    create: {
      email: 'test@gmail.com',
      name: '테스트 사용자',
      googleId: 'google_test_12345',
      avatarUrl: null,
    },
  });

  // 2. 샘플 학습 계획 (active 상태)
  const samplePlan = await prisma.studyPlan.create({
    data: {
      userId: testUser.id,
      title: '정보처리기사 필기 합격',
      status: 'active',
      generationMode: 'basic',
      params: {
        studyMaterial: {
          subject: '정보처리기사',
          sources: [
            {
              type: 'book',
              name: '시나공 정보처리기사',
              totalVolume: '900페이지',
              additionalInfo: '하루 최소 1단원',
            },
          ],
        },
        finalGoal: '정보처리기사 필기 합격',
        deadline: '2026-06-15',
        availableTime: '하루 2시간',
        currentLevel: '입문',
        managementStyle: 'normal',
        contentStructure: null,
        focusArea: null,
        studyMode: null,
        weeklyGoal: null,
        notificationFrequency: null,
        motivationFocus: null,
      },
    },
  });

  // 3. Macro Goal
  const goal = await prisma.macroGoal.create({
    data: {
      planId: samplePlan.id,
      title: '정보처리기사 필기 합격',
      description: '5과목 전체 1회독 + 기출문제 풀이',
      order: 0,
    },
  });

  // 4. Milestone
  const milestone1 = await prisma.milestone.create({
    data: {
      goalId: goal.id,
      title: '1과목 소프트웨어 설계 1회독',
      targetDate: new Date('2026-04-30'),
      status: 'in_progress',
      order: 0,
    },
  });

  const milestone2 = await prisma.milestone.create({
    data: {
      goalId: goal.id,
      title: '2과목 소프트웨어 개발 1회독',
      targetDate: new Date('2026-05-15'),
      status: 'pending',
      order: 1,
    },
  });

  // 5. Todo Nodes
  const node1 = await prisma.todoNode.create({
    data: {
      milestoneId: milestone1.id,
      title: '1장 요구사항 확인 (p.1-45)',
      status: 'done',
      order: 0,
      estimatedMinutes: 120,
      generationBasis: 'volume_based',
      studyGuide: {
        objective: '요구사항 분석 기법 이해',
        prerequisites: [],
        generationBasis: 'volume_based',
        notes: null,
      },
    },
  });

  const node2 = await prisma.todoNode.create({
    data: {
      milestoneId: milestone1.id,
      title: '2장 화면 설계 (p.46-90)',
      status: 'in_progress',
      order: 1,
      estimatedMinutes: 90,
      generationBasis: 'volume_based',
      studyGuide: {
        objective: 'UML, UI 설계 기법 이해',
        prerequisites: ['1장 요구사항 확인'],
        generationBasis: 'volume_based',
        notes: null,
      },
    },
  });

  const node3 = await prisma.todoNode.create({
    data: {
      milestoneId: milestone1.id,
      title: '3장 애플리케이션 설계 (p.91-140)',
      status: 'todo',
      order: 2,
      estimatedMinutes: 120,
      generationBasis: 'volume_based',
      studyGuide: {
        objective: '아키텍처 패턴, 모듈화 이해',
        prerequisites: ['2장 화면 설계'],
        generationBasis: 'volume_based',
        notes: null,
      },
    },
  });

  console.log('Seed data created successfully');
  console.log(`  User: ${testUser.id} (${testUser.email})`);
  console.log(`  Plan: ${samplePlan.id} (${samplePlan.title})`);
  console.log(`  Goal: ${goal.id}`);
  console.log(`  Milestones: ${milestone1.id}, ${milestone2.id}`);
  console.log(`  Nodes: ${node1.id}, ${node2.id}, ${node3.id}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
