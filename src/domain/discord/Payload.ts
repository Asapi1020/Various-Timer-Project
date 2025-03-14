export interface Payload {
	content?: string;
	embeds?: {
		title: string;
		description: string;
		author?: {
			name: string;
			url?: string;
			icon_url?: string;
		};
		url?: string;
		image?: {
			url: string;
		};
		color?: number;
		timestamp?: string;
	}[];
}
