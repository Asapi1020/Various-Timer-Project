export interface WorkshopProps {
	appID: number;
	webhookUrl: string;
	lastUploadedThreadID: string;
	lastUpdatedThreadID: string;
	lastAlerted: Date;
}
