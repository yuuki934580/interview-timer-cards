import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// 環境変数チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const feedbackToEmail = process.env.FEEDBACK_TO_EMAIL;
const feedbackFromEmail = process.env.FEEDBACK_FROM_EMAIL;
const appBaseUrl = process.env.APP_BASE_URL || '';

export async function POST(request: Request) {
  // --- バリデーション ---
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Supabase環境変数が未設定:', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '設定済み' : '未設定',
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? '設定済み' : '未設定',
    });
    return NextResponse.json(
      { ok: false, error: 'サーバー設定エラーです。管理者に連絡してください。' },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'リクエストの形式が正しくありません' },
      { status: 400 }
    );
  }

  const { message, email, page, user_agent } = body;

  // メッセージのバリデーション
  if (!message || !message.trim()) {
    return NextResponse.json(
      { ok: false, error: 'メッセージは必須です' },
      { status: 400 }
    );
  }
  if (message.trim().length > 2000) {
    return NextResponse.json(
      { ok: false, error: 'メッセージは2000文字以内で入力してください' },
      { status: 400 }
    );
  }

  // --- Supabaseに保存 ---
  console.log('=== フィードバックAPI: DB保存開始 ===');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error: dbError } = await supabase
    .from('feedback')
    .insert({
      message: message.trim(),
      email: email?.trim() || null,
      page: page || null,
      user_agent: user_agent || null,
    })
    .select()
    .single();

  if (dbError) {
    console.error('❌ Supabase insertエラー:', {
      message: dbError.message,
      code: dbError.code,
      details: dbError.details,
      hint: dbError.hint,
    });
    return NextResponse.json(
      { ok: false, error: `DB保存エラー: ${dbError.message}` },
      { status: 500 }
    );
  }

  console.log('✅ DB保存成功:', data);

  // --- Resendでメール通知 ---
  let mailSent = false;

  if (!resendApiKey || !feedbackToEmail || !feedbackFromEmail) {
    console.warn('⚠️ メール環境変数が未設定のためスキップ:', {
      RESEND_API_KEY: resendApiKey ? '設定済み' : '未設定',
      FEEDBACK_TO_EMAIL: feedbackToEmail ? '設定済み' : '未設定',
      FEEDBACK_FROM_EMAIL: feedbackFromEmail ? '設定済み' : '未設定',
    });
  } else {
    try {
      const resend = new Resend(resendApiKey);

      const adminUrl = appBaseUrl
        ? `${appBaseUrl}/admin/feedback`
        : '/admin/feedback';

      const createdAt = data?.created_at
        ? new Date(data.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        : new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

      const { error: mailError } = await resend.emails.send({
        from: feedbackFromEmail,
        to: feedbackToEmail,
        subject: '[面接くん] 新しいフィードバックが届きました',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">📬 新しいフィードバック</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <tr>
                <td style="padding: 8px; background: #f3f4f6; font-weight: bold; width: 120px;">受信日時</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${createdAt}</td>
              </tr>
              <tr>
                <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">送信ページ</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${page || '不明'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; background: #f3f4f6; font-weight: bold;">メール</td>
                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${email?.trim() || '未入力'}</td>
              </tr>
            </table>

            <h3 style="color: #1f2937;">メッセージ</h3>
            <div style="background: #f9fafb; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 24px; white-space: pre-wrap; font-size: 15px; line-height: 1.6;">
              ${message.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>

            <a href="${adminUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              管理画面で確認する →
            </a>

            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
              このメールは 面接くん のフィードバック機能から自動送信されました。
            </p>
          </div>
        `,
      });

      if (mailError) {
        console.error('❌ Resendメール送信エラー:', mailError);
      } else {
        console.log('✅ メール送信成功');
        mailSent = true;
      }
    } catch (mailException: any) {
      console.error('❌ Resend例外:', mailException);
    }
  }

  return NextResponse.json({
    ok: true,
    saved: true,
    mailSent,
  });
}
