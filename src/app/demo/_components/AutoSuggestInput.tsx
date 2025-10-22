"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface AutoSuggestInputProps {
	id: string;
	label: string;
	placeholder?: string;
	value: string;
	onChange: (next: string) => void;
	staticOptions?: string[];
	getDynamicOptions?: (query: string) => Promise<string[]>;
	localStorageKey?: string; // used to persist recent selections
}

export default function AutoSuggestInput({
	id,
	label,
	placeholder,
	value,
	onChange,
	staticOptions = [],
	getDynamicOptions,
	localStorageKey,
}: AutoSuggestInputProps) {
	const [open, setOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(0);
	const [dynamicOptions, setDynamicOptions] = useState<string[]>([]);
	const [recentOptions, setRecentOptions] = useState<string[]>([]);
	const containerRef = useRef<HTMLDivElement>(null);

	// Load recents on mount
	useEffect(() => {
		if (!localStorageKey) return;
		try {
			const raw = localStorage.getItem(localStorageKey);
			if (raw) setRecentOptions(JSON.parse(raw));
		} catch {}
	}, [localStorageKey]);

	// Persist on selection
	const persistRecent = (selection: string) => {
		if (!localStorageKey) return;
		const next = [selection, ...recentOptions.filter((v) => v.toLowerCase() !== selection.toLowerCase())].slice(0, 10);
		setRecentOptions(next);
		try {
			localStorage.setItem(localStorageKey, JSON.stringify(next));
		} catch {}
	};

	// Fetch dynamic when value changes
	useEffect(() => {
		let cancelled = false;
		const run = async () => {
			if (!getDynamicOptions) {
				setDynamicOptions([]);
				return;
			}
			const q = value.trim();
			if (!q) {
				setDynamicOptions([]);
				return;
			}
			try {
				const results = await getDynamicOptions(q);
				if (!cancelled) setDynamicOptions(results || []);
			} catch {
				if (!cancelled) setDynamicOptions([]);
			}
		};
		run();
		return () => {
			cancelled = true;
		};
	}, [value, getDynamicOptions]);

	// Build merged list: recent first when empty query, then filtered static, then dynamic
	const suggestions = useMemo(() => {
		const q = value.trim().toLowerCase();
		const startWith = (opt: string) => opt.toLowerCase().startsWith(q);
		const include = (opt: string) => opt.toLowerCase().includes(q);

		const uniq = (arr: string[]) => Array.from(new Set(arr.map((s) => s.trim()))).filter(Boolean);

		if (!q) {
			return uniq([...recentOptions, ...staticOptions]).slice(0, 8);
		}

		const staticMatches = uniq([
			...staticOptions.filter(startWith),
			...staticOptions.filter((s) => !startWith(s) && include(s)),
		]);

		const dynamicMatches = uniq([
			...dynamicOptions.filter(startWith),
			...dynamicOptions.filter((s) => !startWith(s) && include(s)),
		]);

		return uniq([...staticMatches, ...dynamicMatches]).slice(0, 8);
	}, [value, staticOptions, dynamicOptions, recentOptions]);

	// Close on outside click
	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			if (!containerRef.current) return;
			if (!containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", onDocClick);
		return () => document.removeEventListener("mousedown", onDocClick);
	}, []);

	const acceptSuggestion = (s?: string) => {
		const pick = s ?? suggestions[highlightIndex];
		if (!pick) return;
		onChange(pick);
		persistRecent(pick);
		setOpen(false);
	};

	return (
		<div className="group relative" ref={containerRef}>
			<label htmlFor={id} className="block text-sm font-bold text-gray-800 mb-3 tracking-wide">
				{label}
			</label>
			<div className="relative">
				<input
					type="text"
					id={id}
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						setOpen(true);
						setHighlightIndex(0);
					}}
					placeholder={placeholder}
					className="w-full px-5 py-4 border-0 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-pink-500/20 placeholder-gray-400 transition-all duration-300 group-hover:shadow-xl bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm text-gray-800 font-medium"
					onFocus={() => setOpen(true)}
					onKeyDown={(e) => {
						if (e.key === "Tab" && open && suggestions.length > 0) {
							e.preventDefault();
							acceptSuggestion();
							return;
						}
						if (e.key === "ArrowDown") {
							e.preventDefault();
							setOpen(true);
							setHighlightIndex((i) => Math.min(i + 1, Math.max(0, suggestions.length - 1)));
						}
						if (e.key === "ArrowUp") {
							e.preventDefault();
							setHighlightIndex((i) => Math.max(0, i - 1));
						}
						if (e.key === "Enter" && open && suggestions.length > 0) {
							e.preventDefault();
							acceptSuggestion();
						}
					}}
					onBlur={(e) => {
						// small delay to allow click selection
						setTimeout(() => setOpen(false), 100);
						if (value.trim()) persistRecent(value.trim());
					}}
				/>
				<div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

					{open && suggestions.length > 0 && (
						<div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-xl border border-white/70 rounded-2xl shadow-xl shadow-pink-500/10 overflow-hidden">
						<ul className="max-h-64 overflow-auto py-2">
							{suggestions.map((s, idx) => (
								<li
									key={`${id}-opt-${idx}-${s}`}
									className={`px-4 py-3 text-sm cursor-pointer transition-colors duration-150 ${
										highlightIndex === idx ? "bg-pink-50 text-pink-800" : "hover:bg-gray-50"
									}`}
									onMouseEnter={() => setHighlightIndex(idx)}
									onMouseDown={(e) => {
										// prevent input blur before click handler
										e.preventDefault();
										acceptSuggestion(s);
									}}
								>
									{s}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		</div>
	);
}


