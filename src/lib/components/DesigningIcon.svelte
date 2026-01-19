<!-- SVG background (full button) -->
<svg
	viewBox="0 0 64 40"
	class="h-full w-full"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-hidden="true"
>
	<defs>
		<linearGradient id="g1" x1="0" x2="1">
			<stop offset="0" stop-color="#ffb86b" />
			<stop offset="1" stop-color="#ff6a88" />
		</linearGradient>
		<linearGradient id="g2" x1="0" x2="1">
			<stop offset="0" stop-color="#8bd3ff" />
			<stop offset="1" stop-color="#6a8bff" />
		</linearGradient>
		<linearGradient id="g3" x1="0" x2="1">
			<stop offset="0" stop-color="#31ff2e" />
			<stop offset="1" stop-color="#27cc25" />
		</linearGradient>
	</defs>

	<!-- Background rectangle -->
	<rect x="0" y="0" width="64" height="40" rx="6" fill="url(#g3)" />

	<!-- pencil -->
	<g transform="translate(8,8) rotate(-20 16 8)">
		<rect x="0" y="0" width="28" height="6" rx="1.5" fill="url(#g1)" />
		<polygon points="28,0 32,3 28,6" fill="#f4d19b" />
		<rect x="30" y="1.1" width="2" height="3.8" fill="#b07a59" rx="0.6" />
		<rect x="-2" y="0.8" width="4" height="4.4" fill="#ffdca3" rx="0.8" />
	</g>

	<!-- paintbrush -->
	<g transform="translate(22,12) rotate(20 12 8)">
		<rect x="0" y="0" width="26" height="5" rx="1.5" fill="url(#g2)" />
		<path d="M26 0c0 0 5 1 5 5 0 3-3 5-5 5-2 0-5-2-5-5 0-4 5-5 5-5z" fill="#fff" opacity="0.9" />
		<rect x="-2" y="1" width="4" height="3" fill="#d6eaff" rx="0.5" />
	</g>

	<!-- playful accent circles -->
	<circle cx="34" cy="18" r="3.2" fill="#ffd6e0" opacity="0.9" />
	<circle cx="15" cy="10" r="1.6" fill="#c7f0ff" opacity="0.95" />
</svg>
