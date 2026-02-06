/**
 * User-Friendly Error Messages
 *
 * @description
 * Provides human-readable error messages and translations
 * for better user experience when errors occur.
 */

import { ApplicationError, ErrorCodes } from '../errors/CustomErrors.js';

/**
 * Error message templates
 */
export interface ErrorMessageTemplate {
  title: string;
  message: string;
  suggestion?: string;
  technicalDetails?: string;
}

/**
 * Supported languages
 */
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';

/**
 * Error message catalog
 */
const ERROR_MESSAGES: Record<number, Record<Language, ErrorMessageTemplate>> = {
  // Network errors (1000-1999)
  [ErrorCodes.NETWORK_ERROR]: {
    en: {
      title: 'Connection Problem',
      message: 'We are having trouble connecting to our servers.',
      suggestion: 'Please check your internet connection and try again.',
    },
    es: {
      title: 'Problema de Conexión',
      message: 'Tenemos problemas para conectarnos a nuestros servidores.',
      suggestion: 'Por favor, verifica tu conexión a internet e intenta de nuevo.',
    },
    fr: {
      title: 'Problème de Connexion',
      message: 'Nous avons des difficultés à nous connecter à nos serveurs.',
      suggestion: 'Veuillez vérifier votre connexion Internet et réessayer.',
    },
    de: {
      title: 'Verbindungsproblem',
      message: 'Wir haben Probleme, eine Verbindung zu unseren Servern herzustellen.',
      suggestion: 'Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    },
    zh: {
      title: '连接问题',
      message: '我们在连接服务器时遇到问题。',
      suggestion: '请检查您的互联网连接并重试。',
    },
    ja: {
      title: '接続の問題',
      message: 'サーバーへの接続に問題が発生しています。',
      suggestion: 'インターネット接続を確認して、もう一度お試しください。',
    },
  },

  [ErrorCodes.TIMEOUT]: {
    en: {
      title: 'Request Timeout',
      message: 'The request took too long to complete.',
      suggestion:
        'Please try again. If the problem persists, the service may be experiencing high load.',
    },
    es: {
      title: 'Tiempo de Espera Agotado',
      message: 'La solicitud tardó demasiado en completarse.',
      suggestion:
        'Por favor, intenta de nuevo. Si el problema persiste, el servicio puede estar experimentando alta carga.',
    },
    fr: {
      title: "Délai d'attente dépassé",
      message: 'La requête a pris trop de temps pour se terminer.',
      suggestion:
        'Veuillez réessayer. Si le problème persiste, le service peut être sous forte charge.',
    },
    de: {
      title: 'Zeitüberschreitung',
      message: 'Die Anfrage hat zu lange gedauert.',
      suggestion:
        'Bitte versuchen Sie es erneut. Wenn das Problem weiterhin besteht, ist der Dienst möglicherweise stark ausgelastet.',
    },
    zh: {
      title: '请求超时',
      message: '请求完成时间过长。',
      suggestion: '请重试。如果问题仍然存在，服务可能正在经历高负载。',
    },
    ja: {
      title: 'リクエストタイムアウト',
      message: 'リクエストの完了に時間がかかりすぎました。',
      suggestion:
        'もう一度お試しください。問題が解決しない場合、サービスが高負荷になっている可能性があります。',
    },
  },

  // Auth errors (2000-2999)
  [ErrorCodes.TOKEN_EXPIRED]: {
    en: {
      title: 'Session Expired',
      message: 'Your session has expired for security reasons.',
      suggestion: 'Please log in again to continue.',
    },
    es: {
      title: 'Sesión Expirada',
      message: 'Tu sesión ha expirado por razones de seguridad.',
      suggestion: 'Por favor, inicia sesión nuevamente para continuar.',
    },
    fr: {
      title: 'Session Expirée',
      message: 'Votre session a expiré pour des raisons de sécurité.',
      suggestion: 'Veuillez vous reconnecter pour continuer.',
    },
    de: {
      title: 'Sitzung abgelaufen',
      message: 'Ihre Sitzung ist aus Sicherheitsgründen abgelaufen.',
      suggestion: 'Bitte melden Sie sich erneut an, um fortzufahren.',
    },
    zh: {
      title: '会话已过期',
      message: '出于安全原因，您的会话已过期。',
      suggestion: '请重新登录以继续。',
    },
    ja: {
      title: 'セッション期限切れ',
      message: 'セキュリティ上の理由により、セッションの有効期限が切れました。',
      suggestion: '続行するには、再度ログインしてください。',
    },
  },

  [ErrorCodes.INVALID_CREDENTIALS]: {
    en: {
      title: 'Login Failed',
      message: 'The username or password you entered is incorrect.',
      suggestion:
        'Please check your credentials and try again. If you forgot your password, you can reset it.',
    },
    es: {
      title: 'Inicio de Sesión Fallido',
      message: 'El nombre de usuario o contraseña que ingresaste es incorrecto.',
      suggestion:
        'Por favor, verifica tus credenciales e intenta de nuevo. Si olvidaste tu contraseña, puedes restablecerla.',
    },
    fr: {
      title: 'Échec de la Connexion',
      message: "Le nom d'utilisateur ou le mot de passe que vous avez saisi est incorrect.",
      suggestion:
        'Veuillez vérifier vos identifiants et réessayer. Si vous avez oublié votre mot de passe, vous pouvez le réinitialiser.',
    },
    de: {
      title: 'Anmeldung fehlgeschlagen',
      message: 'Der eingegebene Benutzername oder das Passwort ist falsch.',
      suggestion:
        'Bitte überprüfen Sie Ihre Anmeldedaten und versuchen Sie es erneut. Wenn Sie Ihr Passwort vergessen haben, können Sie es zurücksetzen.',
    },
    zh: {
      title: '登录失败',
      message: '您输入的用户名或密码不正确。',
      suggestion: '请检查您的凭据并重试。如果您忘记了密码，可以重置它。',
    },
    ja: {
      title: 'ログイン失敗',
      message: '入力されたユーザー名またはパスワードが正しくありません。',
      suggestion:
        '認証情報を確認して、もう一度お試しください。パスワードを忘れた場合は、リセットできます。',
    },
  },

  [ErrorCodes.AUTHORIZATION_ERROR]: {
    en: {
      title: 'Access Denied',
      message: "You don't have permission to access this resource.",
      suggestion: 'Please contact your administrator if you believe you should have access.',
    },
    es: {
      title: 'Acceso Denegado',
      message: 'No tienes permiso para acceder a este recurso.',
      suggestion: 'Por favor, contacta a tu administrador si crees que deberías tener acceso.',
    },
    fr: {
      title: 'Accès Refusé',
      message: "Vous n'avez pas la permission d'accéder à cette ressource.",
      suggestion:
        'Veuillez contacter votre administrateur si vous pensez que vous devriez y avoir accès.',
    },
    de: {
      title: 'Zugriff verweigert',
      message: 'Sie haben keine Berechtigung, auf diese Ressource zuzugreifen.',
      suggestion:
        'Bitte wenden Sie sich an Ihren Administrator, wenn Sie glauben, dass Sie Zugriff haben sollten.',
    },
    zh: {
      title: '访问被拒绝',
      message: '您没有访问此资源的权限。',
      suggestion: '如果您认为应该有访问权限，请联系管理员。',
    },
    ja: {
      title: 'アクセス拒否',
      message: 'このリソースにアクセスする権限がありません。',
      suggestion: 'アクセス権があると思われる場合は、管理者に連絡してください。',
    },
  },

  // Business errors (4000-4999)
  [ErrorCodes.NOT_FOUND]: {
    en: {
      title: 'Not Found',
      message: "The resource you're looking for could not be found.",
      suggestion: 'Please check the URL or go back to the previous page.',
    },
    es: {
      title: 'No Encontrado',
      message: 'No se pudo encontrar el recurso que buscas.',
      suggestion: 'Por favor, verifica la URL o regresa a la página anterior.',
    },
    fr: {
      title: 'Non Trouvé',
      message: 'La ressource que vous recherchez est introuvable.',
      suggestion: "Veuillez vérifier l'URL ou revenir à la page précédente.",
    },
    de: {
      title: 'Nicht gefunden',
      message: 'Die gesuchte Ressource konnte nicht gefunden werden.',
      suggestion: 'Bitte überprüfen Sie die URL oder gehen Sie zur vorherigen Seite zurück.',
    },
    zh: {
      title: '未找到',
      message: '找不到您要查找的资源。',
      suggestion: '请检查URL或返回上一页。',
    },
    ja: {
      title: '見つかりません',
      message: 'お探しのリソースが見つかりませんでした。',
      suggestion: 'URLを確認するか、前のページに戻ってください。',
    },
  },

  [ErrorCodes.RATE_LIMIT]: {
    en: {
      title: 'Too Many Requests',
      message: "You've made too many requests in a short period.",
      suggestion: 'Please wait a moment before trying again.',
    },
    es: {
      title: 'Demasiadas Solicitudes',
      message: 'Has realizado demasiadas solicitudes en un corto período.',
      suggestion: 'Por favor, espera un momento antes de intentar de nuevo.',
    },
    fr: {
      title: 'Trop de Requêtes',
      message: 'Vous avez fait trop de requêtes en peu de temps.',
      suggestion: 'Veuillez patienter un moment avant de réessayer.',
    },
    de: {
      title: 'Zu viele Anfragen',
      message: 'Sie haben in kurzer Zeit zu viele Anfragen gestellt.',
      suggestion: 'Bitte warten Sie einen Moment, bevor Sie es erneut versuchen.',
    },
    zh: {
      title: '请求过多',
      message: '您在短时间内发出了太多请求。',
      suggestion: '请稍等片刻再试。',
    },
    ja: {
      title: 'リクエストが多すぎます',
      message: '短時間に多くのリクエストを行いました。',
      suggestion: 'しばらくお待ちいただいてから、もう一度お試しください。',
    },
  },

  // System errors (5000-5999)
  [ErrorCodes.SYSTEM_ERROR]: {
    en: {
      title: 'System Error',
      message: 'An unexpected error occurred on our servers.',
      suggestion: "We're working to fix this. Please try again later.",
    },
    es: {
      title: 'Error del Sistema',
      message: 'Ocurrió un error inesperado en nuestros servidores.',
      suggestion: 'Estamos trabajando para solucionarlo. Por favor, intenta más tarde.',
    },
    fr: {
      title: 'Erreur Système',
      message: "Une erreur inattendue s'est produite sur nos serveurs.",
      suggestion: 'Nous travaillons à la résoudre. Veuillez réessayer plus tard.',
    },
    de: {
      title: 'Systemfehler',
      message: 'Auf unseren Servern ist ein unerwarteter Fehler aufgetreten.',
      suggestion: 'Wir arbeiten an einer Lösung. Bitte versuchen Sie es später erneut.',
    },
    zh: {
      title: '系统错误',
      message: '我们的服务器发生了意外错误。',
      suggestion: '我们正在努力解决这个问题。请稍后再试。',
    },
    ja: {
      title: 'システムエラー',
      message: 'サーバーで予期しないエラーが発生しました。',
      suggestion: '修正に取り組んでいます。後でもう一度お試しください。',
    },
  },

  [ErrorCodes.SERVICE_UNAVAILABLE]: {
    en: {
      title: 'Service Unavailable',
      message: 'The service is temporarily unavailable.',
      suggestion:
        "We're performing maintenance or experiencing high traffic. Please try again in a few minutes.",
    },
    es: {
      title: 'Servicio No Disponible',
      message: 'El servicio no está disponible temporalmente.',
      suggestion:
        'Estamos realizando mantenimiento o experimentando mucho tráfico. Por favor, intenta de nuevo en unos minutos.',
    },
    fr: {
      title: 'Service Indisponible',
      message: 'Le service est temporairement indisponible.',
      suggestion:
        'Nous effectuons une maintenance ou connaissons un trafic élevé. Veuillez réessayer dans quelques minutes.',
    },
    de: {
      title: 'Service nicht verfügbar',
      message: 'Der Dienst ist vorübergehend nicht verfügbar.',
      suggestion:
        'Wir führen Wartungsarbeiten durch oder haben einen hohen Datenverkehr. Bitte versuchen Sie es in ein paar Minuten erneut.',
    },
    zh: {
      title: '服务不可用',
      message: '服务暂时不可用。',
      suggestion: '我们正在进行维护或遇到高流量。请在几分钟后重试。',
    },
    ja: {
      title: 'サービス利用不可',
      message: 'サービスが一時的に利用できません。',
      suggestion:
        'メンテナンス中またはトラフィックが高くなっています。数分後にもう一度お試しください。',
    },
  },
};

/**
 * Default error message for unknown errors
 */
const DEFAULT_ERROR_MESSAGE: Record<Language, ErrorMessageTemplate> = {
  en: {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred.',
    suggestion: 'Please try again. If the problem persists, contact support.',
  },
  es: {
    title: 'Algo Salió Mal',
    message: 'Ocurrió un error inesperado.',
    suggestion: 'Por favor, intenta de nuevo. Si el problema persiste, contacta al soporte.',
  },
  fr: {
    title: 'Une Erreur est Survenue',
    message: "Une erreur inattendue s'est produite.",
    suggestion: 'Veuillez réessayer. Si le problème persiste, contactez le support.',
  },
  de: {
    title: 'Etwas ist schief gelaufen',
    message: 'Ein unerwarteter Fehler ist aufgetreten.',
    suggestion:
      'Bitte versuchen Sie es erneut. Wenn das Problem weiterhin besteht, wenden Sie sich an den Support.',
  },
  zh: {
    title: '出了点问题',
    message: '发生了意外错误。',
    suggestion: '请重试。如果问题仍然存在，请联系支持。',
  },
  ja: {
    title: '問題が発生しました',
    message: '予期しないエラーが発生しました。',
    suggestion: 'もう一度お試しください。問題が解決しない場合は、サポートに連絡してください。',
  },
};

/**
 * Error message formatter
 */
export class ErrorMessageFormatter {
  private currentLanguage: Language = 'en';

  /**
   * Set the current language
   */
  setLanguage(language: Language): void {
    this.currentLanguage = language;
  }

  /**
   * Get the current language
   */
  getLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Get user-friendly error message
   */
  format(error: ApplicationError | Error | number, language?: Language): ErrorMessageTemplate {
    const lang = language || this.currentLanguage;

    // If error is a number (error code), get the message for that code
    if (typeof error === 'number') {
      return this.getMessageByCode(error, lang);
    }

    // If error is an ApplicationError, use its code
    if (error instanceof ApplicationError) {
      const message = this.getMessageByCode(error.code, lang);

      // Enhance with error-specific details
      return {
        ...message,
        technicalDetails: error.message,
      };
    }

    // For generic errors, return default message
    return {
      ...DEFAULT_ERROR_MESSAGE[lang],
      technicalDetails: error.message,
    };
  }

  /**
   * Get message by error code
   */
  private getMessageByCode(code: number, language: Language): ErrorMessageTemplate {
    return ERROR_MESSAGES[code]?.[language] || DEFAULT_ERROR_MESSAGE[language];
  }

  /**
   * Get title only
   */
  getTitle(error: ApplicationError | Error | number, language?: Language): string {
    return this.format(error, language).title;
  }

  /**
   * Get message only
   */
  getMessage(error: ApplicationError | Error | number, language?: Language): string {
    return this.format(error, language).message;
  }

  /**
   * Get suggestion only
   */
  getSuggestion(error: ApplicationError | Error | number, language?: Language): string | undefined {
    return this.format(error, language).suggestion;
  }

  /**
   * Add custom error message
   */
  addCustomMessage(code: number, messages: Record<Language, ErrorMessageTemplate>): void {
    ERROR_MESSAGES[code] = messages;
  }
}

/**
 * Global error message formatter instance
 */
export const errorMessageFormatter = new ErrorMessageFormatter();

/**
 * Convenience function to get user-friendly error message
 */
export function getUserFriendlyMessage(
  error: ApplicationError | Error | number,
  language?: Language
): ErrorMessageTemplate {
  return errorMessageFormatter.format(error, language);
}
