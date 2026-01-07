import 'dotenv/config';
import { getCollection } from '../app/lib/db.server';
import { createUser } from '../app/lib/auth.server';
import type { Quiz } from '../app/types/quiz';

/**
 * Seed Script
 * 
 * Creates test data for development:
 * - Admin user
 * - Regular user
 * - Sample quizzes
 */

async function seed() {
    console.log('🌱 Seeding database...\n');

    // Create admin user
    console.log('Creating admin user...');
    try {
        const admin = await createUser('admin@wellness.com', 'admin123', 'admin');
        console.log('✅ Admin user created:', admin.email);
    } catch (error) {
        console.log('ℹ️  Admin user already exists');
    }

    // Create regular user
    console.log('Creating regular user...');
    try {
        const user = await createUser('user@wellness.com', 'user123', 'user');
        console.log('✅ Regular user created:', user.email);
    } catch (error) {
        console.log('ℹ️  Regular user already exists');
    }

    // Create sample quizzes
    console.log('\nCreating sample quizzes...');
    const quizzes = await getCollection<Quiz>('quizzes');

    // Quiz 1: Depression Screening (PHQ-9 inspired)
    const quiz1: Omit<Quiz, '_id'> = {
        title: 'Depression Screening (PHQ-9)',
        description: 'A brief questionnaire to assess symptoms of depression over the past two weeks.',
        questions: [
            {
                id: '1',
                text: 'Little interest or pleasure in doing things',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
            {
                id: '2',
                text: 'Feeling down, depressed, or hopeless',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
            {
                id: '3',
                text: 'Trouble falling or staying asleep, or sleeping too much',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
            {
                id: '4',
                text: 'Feeling tired or having little energy',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
            {
                id: '5',
                text: 'Poor appetite or overeating',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
        ],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Quiz 2: Anxiety Assessment (GAD-7 inspired)
    const quiz2: Omit<Quiz, '_id'> = {
        title: 'Anxiety Assessment (GAD-7)',
        description: 'A screening tool to assess generalized anxiety disorder symptoms.',
        questions: [
            {
                id: '1',
                text: 'Feeling nervous, anxious, or on edge',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
            {
                id: '2',
                text: 'Not being able to stop or control worrying',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
            {
                id: '3',
                text: 'Worrying too much about different things',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
            {
                id: '4',
                text: 'Trouble relaxing',
                type: 'multiple-choice',
                options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
                scoreMapping: {
                    'Not at all': 0,
                    'Several days': 1,
                    'More than half the days': 2,
                    'Nearly every day': 3,
                },
            },
        ],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Quiz 3: Stress Level Check
    const quiz3: Omit<Quiz, '_id'> = {
        title: 'Stress Level Assessment',
        description: 'Evaluate your current stress levels and identify potential stressors.',
        questions: [
            {
                id: '1',
                text: 'How would you rate your overall stress level this week?',
                type: 'scale',
                scaleMin: 1,
                scaleMax: 10,
            },
            {
                id: '2',
                text: 'How often do you feel overwhelmed by your responsibilities?',
                type: 'multiple-choice',
                options: ['Rarely', 'Sometimes', 'Often', 'Always'],
                scoreMapping: {
                    'Rarely': 1,
                    'Sometimes': 3,
                    'Often': 6,
                    'Always': 10,
                },
            },
            {
                id: '3',
                text: 'How well are you sleeping?',
                type: 'multiple-choice',
                options: ['Very well', 'Fairly well', 'Not very well', 'Poorly'],
                scoreMapping: {
                    'Very well': 0,
                    'Fairly well': 2,
                    'Not very well': 5,
                    'Poorly': 8,
                },
            },
            {
                id: '4',
                text: 'Rate your ability to cope with daily challenges',
                type: 'scale',
                scaleMin: 1,
                scaleMax: 10,
            },
        ],
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Insert quizzes
    const existingQuizzes = await quizzes.countDocuments();
    if (existingQuizzes === 0) {
        await quizzes.insertMany([quiz1 as Quiz, quiz2 as Quiz, quiz3 as Quiz]);
        console.log('✅ Created 3 sample quizzes');
    } else {
        console.log(`ℹ️  Database already has ${existingQuizzes} quizzes`);
    }

    console.log('\n✅ Seeding complete!\n');
    console.log('📝 Test credentials:');
    console.log('   Admin: admin@wellness.com / admin123');
    console.log('   User:  user@wellness.com / user123\n');

    process.exit(0);
}

seed().catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
});
