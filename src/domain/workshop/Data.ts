export interface BasicData {
	title: string;
	link: string;
	thumbnail: string;
	author: {
		name: string;
		link: string;
	};
}

export interface DetailData {
	description: string;
	postedAt: Date;
	updatedAt?: Date;
	preview?: string;
	authorAvatar?: string;
}

export type Data = BasicData & DetailData;
