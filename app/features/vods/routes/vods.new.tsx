import { useLoaderData } from "@remix-run/react";
import {
	Controller,
	get,
	useFieldArray,
	useFormContext,
	useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod/v4";
import { SendouButton } from "~/components/elements/Button";
import { UserSearch } from "~/components/elements/UserSearch";
import { FormMessage } from "~/components/FormMessage";
import { AddFieldButton } from "~/components/form/AddFieldButton";
import { RemoveFieldButton } from "~/components/form/RemoveFieldButton";
import { Label } from "~/components/Label";
import { Main } from "~/components/Main";
import { WeaponSelect } from "~/components/WeaponSelect";
import type { Tables } from "~/db/tables";
import { modesShort } from "~/modules/in-game-lists/modes";
import { stageIds } from "~/modules/in-game-lists/stage-ids";
import { useHasRole } from "~/modules/permissions/hooks";
import type { SendouRouteHandle } from "~/utils/remix.server";
import { Alert } from "../../../components/Alert";
import { DateFormField } from "../../../components/form/DateFormField";
import { InputFormField } from "../../../components/form/InputFormField";
import { SelectFormField } from "../../../components/form/SelectFormField";
import { SendouForm } from "../../../components/form/SendouForm";
import { action } from "../actions/vods.new.server";
import { loader } from "../loaders/vods.new.server";
import { videoMatchTypes } from "../vods-constants";
import { videoInputSchema } from "../vods-schemas";
export { action, loader };

export const handle: SendouRouteHandle = {
	i18n: ["vods", "calendar"],
};

export type VodFormFields = z.infer<typeof videoInputSchema>;

export default function NewVodPage() {
	const isVideoAdder = useHasRole("VIDEO_ADDER");
	const data = useLoaderData<typeof loader>();
	const { t } = useTranslation(["vods"]);

	if (!isVideoAdder) {
		return (
			<Main className="stack items-center">
				<Alert variation="WARNING">{t("vods:gainPerms")}</Alert>
			</Main>
		);
	}

	return (
		<Main halfWidth>
			<SendouForm
				heading={
					data.vodToEdit
						? t("vods:forms.title.edit")
						: t("vods:forms.title.create")
				}
				schema={videoInputSchema}
				defaultValues={
					data.vodToEdit
						? {
								vodToEditId: data.vodToEdit.id,
								video: data.vodToEdit,
							}
						: {
								video: {
									type: "TOURNAMENT",
									matches: [
										{ mode: "SZ", stageId: 1, startsAt: "", weapons: [] },
									],
									pov: { type: "USER" } as VodFormFields["video"]["pov"],
								},
							}
				}
			>
				<FormFields />
			</SendouForm>
		</Main>
	);
}

function FormFields() {
	const { t } = useTranslation(["vods"]);
	const videoType = useWatch({
		name: "video.type",
	}) as VodFormFields["video"]["type"];

	return (
		<>
			<InputFormField<VodFormFields>
				label={t("vods:forms.title.youtubeUrl")}
				name="video.youtubeUrl"
				placeholder="https://www.youtube.com/watch?v=-dQ6JsVIKdY"
				required
				size="medium"
			/>

			<InputFormField<VodFormFields>
				label={t("vods:forms.title.videoTitle")}
				name="video.title"
				placeholder="[SCL 47] (Grand Finals) Team Olive vs. Kraken Paradise"
				required
				size="medium"
			/>

			<DateFormField<VodFormFields>
				label={t("vods:forms.title.videoDate")}
				name="video.date"
				required
				size="extra-small"
			/>

			<SelectFormField<VodFormFields>
				label={t("vods:forms.title.type")}
				name="video.type"
				values={videoMatchTypes.map((role) => ({
					value: role,
					label: t(`vods:type.${role}`),
				}))}
				required
			/>

			{videoType !== "CAST" ? <PovFormField /> : null}

			<MatchesFormfield videoType={videoType} />
		</>
	);
}

function PovFormField() {
	const { t } = useTranslation(["vods", "calendar"]);
	const methods = useFormContext<VodFormFields>();

	const povNameError = get(methods.formState.errors, "video.pov.name");

	return (
		<Controller
			control={methods.control}
			name="video.pov"
			render={({
				field: { onChange, onBlur, value },
				fieldState: { error },
			}) => {
				// biome-ignore lint/complexity/noUselessFragments: Biome upgrade
				if (!value) return <></>;

				const asPlainInput = value.type === "NAME";

				const toggleInputType = () => {
					if (asPlainInput) {
						onChange({ type: "USER", userId: undefined });
					} else {
						onChange({ type: "NAME", name: "" });
					}
				};

				return (
					<div>
						{asPlainInput ? (
							<>
								<Label required htmlFor="pov">
									{t("vods:forms.title.pov")}
								</Label>
								<input
									id="pov"
									value={value.name ?? ""}
									onChange={(e) => {
										onChange({ type: "NAME", name: e.target.value });
									}}
									onBlur={onBlur}
								/>
							</>
						) : (
							<UserSearch
								label={t("vods:forms.title.pov")}
								isRequired
								name="team-player"
								initialUserId={value.userId}
								onChange={(newUser) =>
									onChange({
										type: "USER",
										userId: newUser.id,
									})
								}
								onBlur={onBlur}
							/>
						)}
						<SendouButton
							size="small"
							variant="minimal"
							onPress={toggleInputType}
							className="outline-theme mt-2"
						>
							{asPlainInput
								? t("calendar:forms.team.player.addAsUser")
								: t("calendar:forms.team.player.addAsText")}
						</SendouButton>
						{error && (
							<FormMessage type="error">{error.message as string}</FormMessage>
						)}
						{povNameError && (
							<FormMessage type="error">
								{povNameError.message as string}
							</FormMessage>
						)}
					</div>
				);
			}}
		/>
	);
}

function MatchesFormfield({
	videoType,
}: {
	videoType: Tables["Video"]["type"];
}) {
	const {
		formState: { errors },
	} = useFormContext<VodFormFields>();
	const { fields, append, remove } = useFieldArray<VodFormFields>({
		name: "video.matches",
	});

	const rootError = errors.video?.matches?.root;

	return (
		<div>
			<div className="stack md">
				{fields.map((field, i) => {
					return (
						<MatchesFieldset
							key={field.id}
							idx={i}
							remove={remove}
							canRemove={fields.length > 1}
							videoType={videoType}
						/>
					);
				})}
				<AddFieldButton
					onClick={() => {
						append({ mode: "SZ", stageId: 1, startsAt: "", weapons: [] });
					}}
				/>
				{rootError && (
					<FormMessage type="error">{rootError.message as string}</FormMessage>
				)}
			</div>
		</div>
	);
}

function MatchesFieldset({
	idx,
	remove,
	canRemove,
	videoType,
}: {
	idx: number;
	remove: (idx: number) => void;
	canRemove: boolean;
	videoType: Tables["Video"]["type"];
}) {
	const { t } = useTranslation(["vods", "game-misc"]);

	return (
		<div className="stack md">
			<div className="stack horizontal sm">
				<h2 className="text-md">{t("vods:gameCount", { count: idx + 1 })}</h2>
				{canRemove ? <RemoveFieldButton onClick={() => remove(idx)} /> : null}
			</div>

			<InputFormField<VodFormFields>
				required
				label={t("vods:forms.title.startTimestamp")}
				name={`video.matches.${idx}.startsAt`}
				placeholder="10:22"
			/>

			<div className="stack horizontal sm">
				<SelectFormField<VodFormFields>
					required
					label={t("vods:forms.title.mode")}
					name={`video.matches.${idx}.mode`}
					values={modesShort.map((mode) => ({
						value: mode,
						label: t(`game-misc:MODE_SHORT_${mode}`),
					}))}
				/>

				<SelectFormField<VodFormFields>
					required
					label={t("vods:forms.title.stage")}
					name={`video.matches.${idx}.stageId`}
					values={stageIds.map((stageId) => ({
						value: stageId,
						label: t(`game-misc:STAGE_${stageId}`),
					}))}
				/>
			</div>

			<Controller
				control={useFormContext<VodFormFields>().control}
				name={`video.matches.${idx}.weapons`}
				render={({ field: { onChange, value } }) => {
					return (
						<div>
							{videoType === "CAST" ? (
								<div>
									<Label required>{t("vods:forms.title.weaponsTeamOne")}</Label>
									<div className="stack sm">
										{new Array(4).fill(null).map((_, i) => {
											return (
												<WeaponSelect
													key={i}
													isRequired
													testId={`player-${i}-weapon`}
													value={value[i] ?? null}
													onChange={(weaponId) => {
														const weapons = [...value];
														weapons[i] = weaponId;

														onChange(weapons);
													}}
												/>
											);
										})}
									</div>
									<div className="mt-4">
										<Label required>
											{t("vods:forms.title.weaponsTeamTwo")}
										</Label>
										<div className="stack sm">
											{new Array(4).fill(null).map((_, i) => {
												const adjustedI = i + 4;
												return (
													<WeaponSelect
														key={i}
														isRequired
														testId={`player-${adjustedI}-weapon`}
														value={value[adjustedI] ?? null}
														onChange={(weaponId) => {
															const weapons = [...value];
															weapons[adjustedI] = weaponId;

															onChange(weapons);
														}}
													/>
												);
											})}
										</div>
									</div>
								</div>
							) : (
								<WeaponSelect
									label={t("vods:forms.title.weapon")}
									isRequired
									testId={`match-${idx}-weapon`}
									value={value[0] ?? null}
									onChange={(weaponId) => onChange([weaponId])}
								/>
							)}
						</div>
					);
				}}
			/>
		</div>
	);
}
