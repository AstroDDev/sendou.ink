export function ChevronUpDownIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			className={className}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
			/>
		</svg>
	);
}
