import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/seed
 * Seeds 50+ opportunities with mixed question types.
 * Idempotent: only seeds if no opportunities exist.
 */
export async function POST(_req: NextRequest) {
  try {
    const count = await db.opportunity.count();
    if (count > 0) {
      return NextResponse.json({ message: 'Already seeded', count });
    }

    // Sample opportunities with Kenyan-focused themes
    const opportunities = [
      // ============ SILVER (KES 30-80) ============
      { title: 'M-Pesa Transaction Frequency', description: 'Tell us how often you use M-Pesa and which features matter most to you.', type: 'TASK', tier: 'silver', category: 'Finance', reward: 50, est: 4 },
      { title: 'SACCO Membership Profile', description: 'Tell us about your SACCO membership and how you interact with your savings cooperative.', type: 'TASK', tier: 'silver', category: 'Finance', reward: 55, est: 4 },
      { title: 'Electricity & KPLC Prepaid Tokens', description: 'Help us understand how Kenyans purchase Kenya Power prepaid tokens and manage electricity costs.', type: 'TASK', tier: 'silver', category: 'Utilities', reward: 40, est: 3 },
      { title: 'Water Access & Vendor Usage', description: 'Share how you access clean water and whether you use water vendors in your area.', type: 'TASK', tier: 'silver', category: 'Utilities', reward: 45, est: 3 },
      { title: 'Beverage Brand Comparison', description: 'Complete this task about consumer preferences and spending on beverages.', type: 'TASK', tier: 'silver', category: 'Consumer', reward: 37, est: 3 },
      { title: 'Home Cleaning Product Review', description: 'Complete this task about consumer preferences and spending on cleaning products.', type: 'TASK', tier: 'silver', category: 'Consumer', reward: 44, est: 4 },
      { title: 'Talent Show Participation Survey', description: 'Review entertainment options and content consumption in your area.', type: 'SURVEY', tier: 'silver', category: 'Entertainment', reward: 47, est: 3 },
      { title: 'Investment Club Performance Assessment', description: 'Share your perspective on investment opportunities in your community.', type: 'SURVEY', tier: 'silver', category: 'Finance', reward: 34, est: 4 },
      { title: 'Nutrition Knowledge Assessment', description: 'Assess healthcare access and service quality in your community.', type: 'SURVEY', tier: 'silver', category: 'Health', reward: 49, est: 3 },
      { title: 'Financial Advisor Quality Review', description: 'Share your perspective on investment opportunities and advisor quality.', type: 'SURVEY', tier: 'silver', category: 'Finance', reward: 32, est: 3 },
      { title: 'Horticulture Export Readiness Survey', description: 'Provide feedback on agricultural practices and service quality.', type: 'SURVEY', tier: 'silver', category: 'Agriculture', reward: 58, est: 4 },
      { title: 'Matatu Route Experience Survey', description: 'Evaluate transportation services and infrastructure in your area.', type: 'SURVEY', tier: 'silver', category: 'Transport', reward: 45, est: 3 },
      { title: 'Secondary School Access Review', description: 'Review educational services and learning opportunities.', type: 'SURVEY', tier: 'silver', category: 'Education', reward: 48, est: 4 },
      { title: 'Online Registration Process Check', description: 'Assess digital service availability and user experience.', type: 'SURVEY', tier: 'silver', category: 'Technology', reward: 62, est: 4 },
      { title: 'Cash on Delivery Preference Survey', description: 'Evaluate online shopping platforms and delivery services in Kenya.', type: 'SURVEY', tier: 'silver', category: 'E-commerce', reward: 35, est: 2 },
      { title: 'Recycling Habit Check', description: 'Assess environmental practices and sustainability awareness in your area.', type: 'SURVEY', tier: 'silver', category: 'Environment', reward: 62, est: 3 },
      { title: 'E-Waste Disposal Habit Study', description: 'Evaluate technology usage and digital service quality in Kenya.', type: 'SURVEY', tier: 'silver', category: 'Technology', reward: 51, est: 4 },
      { title: 'WhatsApp Business Usage Survey', description: 'Assess digital service availability and user experience for WhatsApp business.', type: 'SURVEY', tier: 'silver', category: 'Technology', reward: 56, est: 3 },
      { title: 'Education Equity Check Survey', description: 'Review social programs and community development initiatives.', type: 'SURVEY', tier: 'silver', category: 'Education', reward: 44, est: 4 },
      { title: 'Drought Preparedness Assessment', description: 'Assess environmental practices and sustainability awareness in your area.', type: 'SURVEY', tier: 'silver', category: 'Environment', reward: 58, est: 3 },
      // More silver
      { title: 'Mobile Network Quality Survey', description: 'Rate your experience with Safaricom, Airtel, and Telkom networks.', type: 'SURVEY', tier: 'silver', category: 'Technology', reward: 38, est: 2 },
      { title: 'Local Cuisine Preferences', description: 'Tell us about your favorite Kenyan dishes and dining habits.', type: 'SURVEY', tier: 'silver', category: 'Consumer', reward: 42, est: 3 },
      { title: 'Public Transport Satisfaction', description: 'How satisfied are you with boda-boda, matatu, and taxi services?', type: 'SURVEY', tier: 'silver', category: 'Transport', reward: 36, est: 2 },
      { title: 'Airtime Purchase Patterns', description: 'Tell us how often you buy airtime and which channels you prefer.', type: 'SURVEY', tier: 'silver', category: 'Consumer', reward: 30, est: 2 },

      // ============ GOLD (KES 100-250) ============
      { title: 'Group Insurance Satisfaction Survey', description: 'Review insurance product accessibility and service quality.', type: 'TASK', tier: 'gold', category: 'Finance', reward: 62, est: 5 },
      { title: 'Education Technology Adoption Study', description: 'Review educational services and learning opportunities.', type: 'TASK', tier: 'gold', category: 'Education', reward: 42, est: 4 },
      { title: 'Environmental Education Access Review', description: 'Assess environmental practices and sustainability awareness.', type: 'TASK', tier: 'gold', category: 'Environment', reward: 65, est: 4 },
      { title: 'Loan Application Process Feedback', description: 'Share your experience with financial services and providers.', type: 'TASK', tier: 'gold', category: 'Finance', reward: 63, est: 5 },
      { title: 'Real Estate Agent Review', description: 'Assess property and housing market conditions in Kenya.', type: 'TASK', tier: 'gold', category: 'Real Estate', reward: 40, est: 4 },
      { title: 'Devolution Effectiveness Assessment', description: 'Review public service delivery and governance effectiveness.', type: 'TASK', tier: 'gold', category: 'Governance', reward: 63, est: 5 },
      { title: 'SME Business Operations Survey', description: 'Evaluate small business challenges and growth opportunities in Kenya.', type: 'SURVEY', tier: 'gold', category: 'Business', reward: 145, est: 8 },
      { title: 'Smartphone Brand Preference Study', description: 'Tell us about your smartphone usage and brand preferences in Kenya.', type: 'SURVEY', tier: 'gold', category: 'Technology', reward: 110, est: 5 },
      { title: 'Banking App User Experience Review', description: 'Rate mobile banking apps from KCB, Equity, Cooperative, and others.', type: 'SURVEY', tier: 'gold', category: 'Finance', reward: 125, est: 6 },
      { title: 'Online Shopping Behavior Survey', description: 'How do you shop on Jumia, Kilimall, Jiji, and other platforms?', type: 'SURVEY', tier: 'gold', category: 'E-commerce', reward: 130, est: 6 },
      { title: 'Healthcare Provider Quality Assessment', description: 'Review your experience with hospitals and clinics in your area.', type: 'SURVEY', tier: 'gold', category: 'Health', reward: 180, est: 7 },
      { title: 'Internet Service Provider Satisfaction', description: 'Rate Safaricom Home, Zuku, Faiba, and other ISPs in Kenya.', type: 'SURVEY', tier: 'gold', category: 'Technology', reward: 115, est: 5 },
      { title: 'Local Government Service Delivery Review', description: 'Assess county government service quality in your region.', type: 'SURVEY', tier: 'gold', category: 'Governance', reward: 155, est: 7 },
      { title: 'Television Content Preference Survey', description: 'Tell us what you watch on DStv, GoTV, Showmax, and free-to-air channels.', type: 'SURVEY', tier: 'gold', category: 'Entertainment', reward: 100, est: 4 },
      { title: 'Real Estate Investment Patterns', description: 'Share your views on real estate investment opportunities in Kenya.', type: 'SURVEY', tier: 'gold', category: 'Real Estate', reward: 200, est: 8 },

      // ============ VIP (KES 300-800) ============
      { title: 'Production Technology Adoption Check — Advanced', description: 'Evaluate local manufacturing quality and technology adoption.', type: 'TASK', tier: 'vip', category: 'Industry', reward: 117, est: 10 },
      { title: 'Digital Payment Adoption Review — Advanced', description: 'Share your experience with financial services and digital payment systems.', type: 'TASK', tier: 'vip', category: 'Finance', reward: 84, est: 7 },
      { title: 'Solar Panel Adoption Assessment — Advanced', description: 'Share your experience with energy services and renewable energy adoption.', type: 'TASK', tier: 'vip', category: 'Energy', reward: 138, est: 9 },
      { title: 'TikTok Usage Pattern Survey — Advanced', description: 'Review entertainment options and content consumption on TikTok.', type: 'TASK', tier: 'vip', category: 'Entertainment', reward: 100, est: 6 },
      { title: 'Music Streaming Service Comparison — Advanced', description: 'Review entertainment options and content across streaming platforms.', type: 'TASK', tier: 'vip', category: 'Entertainment', reward: 149, est: 8 },
      { title: 'Small & Medium Enterprise (SME) Digital Adoption', description: 'Study on how Kenyan SMEs are adopting digital tools and platforms.', type: 'SURVEY', tier: 'vip', category: 'Business', reward: 700, est: 20 },
      { title: 'Cultural Festival Attendance Review — Premium', description: 'Review entertainment options and content consumption at cultural events.', type: 'SURVEY', tier: 'vip', category: 'Entertainment', reward: 317, est: 12 },
      { title: 'Digital Payment Adoption Review — Premium', description: 'Share your experience with financial services and digital payment systems.', type: 'SURVEY', tier: 'vip', category: 'Finance', reward: 668, est: 15 },
      { title: 'Tech Adoption Barrier Survey — Premium', description: 'Evaluate technology usage and digital service quality barriers.', type: 'SURVEY', tier: 'vip', category: 'Technology', reward: 791, est: 18 },
      { title: 'Local Music Preference Review — Premium', description: 'Review entertainment options and content consumption for Kenyan music.', type: 'SURVEY', tier: 'vip', category: 'Entertainment', reward: 371, est: 10 },
      { title: 'Logistics Technology Adoption Survey — Premium', description: 'Assess logistics and delivery service technology adoption in Kenya.', type: 'SURVEY', tier: 'vip', category: 'Logistics', reward: 559, est: 14 },
      { title: 'Social Media Entertainment Usage — Premium', description: 'Review entertainment options and content consumption on social media.', type: 'SURVEY', tier: 'vip', category: 'Entertainment', reward: 790, est: 16 },
      { title: 'Agricultural Export Market Analysis', description: 'In-depth review of agricultural export opportunities and challenges in Kenya.', type: 'SURVEY', tier: 'vip', category: 'Agriculture', reward: 580, est: 15 },
      { title: 'Cryptocurrency Awareness & Usage Survey', description: 'Share your knowledge and experience with crypto in Kenya.', type: 'SURVEY', tier: 'vip', category: 'Finance', reward: 450, est: 12 },
      { title: 'Real Estate Market Outlook Survey', description: 'Premium review of property market trends and investment opportunities.', type: 'SURVEY', tier: 'vip', category: 'Real Estate', reward: 600, est: 14 },
    ];

    // Question banks for each type
    const q_dropdown = (text: string, options: string[]) => ({ text, answerType: 'DROPDOWN', options: JSON.stringify(options), required: true });
    const q_multi = (text: string, options: string[]) => ({ text, answerType: 'MULTIPLE_CHOICE', options: JSON.stringify(options), required: true });
    const q_rating = (text: string) => ({ text, answerType: 'RATING', options: JSON.stringify(['1', '2', '3', '4', '5']), required: true });
    const q_yesno = (text: string) => ({ text, answerType: 'YES_NO', options: JSON.stringify(['Yes', 'No']), required: true });
    const q_text = (text: string) => ({ text, answerType: 'TEXT', options: JSON.stringify([]), required: true });

    // Common question generator
    function makeQuestions(category: string): any[] {
      const qs: any[] = [];
      let order = 1;

      if (category === 'Finance') {
        qs.push({ ...q_dropdown('How many M-Pesa transactions do you make in a typical day?', ['0', '1', '2', '3', '4', '5', '6–10', 'More than 10']), questionOrder: order++ });
        qs.push({ ...q_multi('Which M-Pesa features do you use regularly?', ['Send money', 'Buy airtime', 'Pay bill', 'Lipa na M-Pesa (Till)', 'Fuliza', 'M-Shwari loan']), questionOrder: order++ });
        qs.push({ ...q_rating('Rate your satisfaction with M-Pesa reliability over the past month.'), questionOrder: order++ });
        qs.push({ ...q_yesno('Have you experienced M-Pesa downtime in the last 30 days?'), questionOrder: order++ });
        qs.push({ ...q_text('What improvement would you suggest for M-Pesa services?'), questionOrder: order++ });
      } else if (category === 'Utilities') {
        qs.push({ ...q_dropdown('How often do you purchase KPLC prepaid tokens?', ['Daily', 'Weekly', 'Monthly', 'Once every 2-3 months', 'Never']), questionOrder: order++ });
        qs.push({ ...q_multi('Which electricity payment methods do you use?', ['M-Pesa', 'Bank', 'KPLC App', 'Agent', 'Token vendor']), questionOrder: order++ });
        qs.push({ ...q_rating('Rate your satisfaction with electricity reliability in your area.'), questionOrder: order++ });
        qs.push({ ...q_yesno('Have you experienced power outages in the last 30 days?'), questionOrder: order++ });
      } else if (category === 'Education') {
        qs.push({ ...q_dropdown('What is your highest level of education?', ['Primary', 'Secondary', 'Certificate', 'Diploma', 'Degree', 'Masters', 'PhD']), questionOrder: order++ });
        qs.push({ ...q_multi('Which learning platforms have you used?', ['YouTube', 'Coursera', 'Udemy', 'edX', 'Khan Academy', 'Local university']), questionOrder: order++ });
        qs.push({ ...q_rating('How would you rate the quality of education in your area?'), questionOrder: order++ });
      } else if (category === 'Technology') {
        qs.push({ ...q_dropdown('What is your primary smartphone brand?', ['Samsung', 'Tecno', 'Infinix', 'iPhone', 'Xiaomi', 'Oppo', 'Other']), questionOrder: order++ });
        qs.push({ ...q_multi('Which mobile networks do you use?', ['Safaricom', 'Airtel', 'Telkom', 'Faiba']), questionOrder: order++ });
        qs.push({ ...q_rating('Rate your overall internet speed satisfaction.'), questionOrder: order++ });
        qs.push({ ...q_yesno('Do you use mobile data more than Wi-Fi?'), questionOrder: order++ });
      } else if (category === 'Entertainment') {
        qs.push({ ...q_dropdown('How many hours per week do you spend on entertainment?', ['<3', '3-10', '10-20', '20-30', '30+']), questionOrder: order++ });
        qs.push({ ...q_multi('Which streaming platforms do you use?', ['YouTube', 'Netflix', 'Showmax', 'TikTok', 'Instagram', 'None']), questionOrder: order++ });
        qs.push({ ...q_rating('Rate the quality of entertainment content available in Kenya.'), questionOrder: order++ });
      } else {
        // Generic question set
        qs.push({ ...q_rating('How satisfied are you with the services in your area?'), questionOrder: order++ });
        qs.push({ ...q_multi('Which of these have you used in the last month?', ['Online payment', 'Mobile app', 'Customer support', 'Physical visit', 'Phone call']), questionOrder: order++ });
        qs.push({ ...q_yesno('Would you recommend this service to a friend?'), questionOrder: order++ });
        qs.push({ ...q_text('Please share any additional feedback.'), questionOrder: order++ });
      }

      return qs;
    }

    // Insert all opportunities + their questions
    for (const opp of opportunities) {
      const created = await db.opportunity.create({
        data: {
          title: opp.title,
          description: opp.description,
          type: opp.type,
          tier: opp.tier,
          category: opp.category,
          reward: opp.reward,
          estimatedMinutes: opp.est,
          status: 'active',
        },
      });
      const questions = makeQuestions(opp.category);
      for (const q of questions) {
        await db.question.create({
          data: {
            opportunityId: created.id,
            questionOrder: q.questionOrder,
            text: q.text,
            answerType: q.answerType,
            options: q.options,
            required: q.required,
          },
        });
      }
    }

    const finalCount = await db.opportunity.count();
    return NextResponse.json({
      message: `Seeded ${opportunities.length} opportunities`,
      count: finalCount,
      tierBreakdown: {
        silver: opportunities.filter(o => o.tier === 'silver').length,
        gold: opportunities.filter(o => o.tier === 'gold').length,
        vip: opportunities.filter(o => o.tier === 'vip').length,
      },
    });
  } catch (err) {
    console.error('[seed] error:', err);
    return NextResponse.json({ error: 'Seed failed: ' + (err.message || err) }, { status: 500 });
  }
}
