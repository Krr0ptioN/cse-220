import { cn } from "ui-common";

export interface SectionProps {
	title: string;
	description?: string;
	className?: string;
	children: React.ReactNode;
}

export function SectionColumns({
	title,
	description,
	children,
	className,
}: SectionProps) {
	return (
		<div className={cn("animate-in fade-in grid grid-cols-1 gap-x-10 gap-y-4 py-8 duration-500 md:grid-cols-10", className)}>
			<div className="w-full space-y-1.5 md:col-span-4">
				<h2 className="font-heading text-lg leading-none font-semibold">
					{title}
				</h2>
				<p className="text-muted-foreground text-sm text-balance">
					{description}
				</p>
			</div>
			<div className="md:col-span-6">{children}</div>
		</div>
	);
}


export function SectionGridList({
	title,
	description,
	children,
	className,
}: SectionProps) {
	return (
		<div className={cn("animate-in fade-in grid grid-cols-1 gap-x-10 gap-y-4 py-8 duration-500", className)}>
			<div className="w-full space-y-1.5">
				<h2 className="font-heading text-lg leading-none font-semibold">
					{title}
				</h2>
				<p className="text-muted-foreground text-sm text-balance">
					{description}
				</p>
			</div>
			<div>{children}</div>
		</div>
	);
}
