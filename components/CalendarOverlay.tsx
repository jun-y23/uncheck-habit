import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@rneui/themed";
import type React from "react";
import { useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Dimensions,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	runOnJS,
	useAnimatedGestureHandler,
} from "react-native-reanimated";
import * as z from "zod";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 50;

const habitLogSchema = z.object({
	status: z.enum(["unchecked", "achieved", "not_achieved"]),
	memo: z.string().max(200, "メモは200文字以内で入力してください"),
});

type HabitLogFormData = z.infer<typeof habitLogSchema>;

interface CalendarOverlayProps {
	isVisible: boolean;
	onClose: () => void;
	onSave: (data: HabitLogFormData) => void;
	initialData: HabitLogFormData;
}

const CalendarOverlay: React.FC<CalendarOverlayProps> = ({
	isVisible,
	onClose,
	onSave,
	initialData,
}) => {
	const translateY = useSharedValue(SCREEN_HEIGHT);

	const { control, handleSubmit, reset } = useForm<HabitLogFormData>({
		resolver: zodResolver(habitLogSchema),
		defaultValues: initialData,
	});

	useEffect(() => {
		if (isVisible) {
			translateY.value = withTiming(0, { duration: 300 });
		} else {
			translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
		}
	}, [isVisible]);

	const rStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateY: translateY.value }],
		};
	});

	const handleClose = useCallback(() => {
		translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
			runOnJS(onClose)();
		});
	}, [onClose]);

	const gestureHandler = useAnimatedGestureHandler({
		onStart: (_, context: { startY: number }) => {
			context.startY = translateY.value;
		},
		onActive: (event, context) => {
			translateY.value = context.startY + event.translationY;
		},
		onEnd: (event) => {
			if (event.translationY > DRAG_THRESHOLD) {
				translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, () => {
					runOnJS(onClose)();
				});
			} else {
				translateY.value = withTiming(0);
			}
		},
	});
	const onSubmit = useCallback(
		(data: HabitLogFormData) => {
			onSave(data);
			handleClose();
		},
		[onSave, handleClose],
	);

	return (
		<View
			style={[
				StyleSheet.absoluteFill,
				styles.container,
				{ display: isVisible ? "flex" : "none" },
			]}
		>
			<TouchableWithoutFeedback onPress={handleClose}>
				<View style={styles.backdrop} />
			</TouchableWithoutFeedback>
			<PanGestureHandler onGestureEvent={gestureHandler}>
				<Animated.View style={[styles.contentContainer, rStyle]}>
					<View style={styles.handle} />
					<Controller
						control={control}
						name="status"
						render={({ field: { onChange, value } }) => (
							<View style={styles.statusButtons}>
								<Button
									title="未チェック"
									onPress={() => onChange("unchecked")}
									type={value === "unchecked" ? "solid" : "outline"}
									buttonStyle={styles.statusButton}
								/>
								<Button
									title="達成"
									onPress={() => onChange("achieved")}
									type={value === "achieved" ? "solid" : "outline"}
									buttonStyle={styles.statusButton}
								/>
								<Button
									title="未達成"
									onPress={() => onChange("not_achieved")}
									type={value === "not_achieved" ? "solid" : "outline"}
									buttonStyle={styles.statusButton}
								/>
							</View>
						)}
					/>
					<Controller
						control={control}
						name="memo"
						render={({
							field: { onChange, onBlur, value },
							fieldState: { error },
						}) => (
							<Input
								placeholder="メモを入力"
								value={value}
								onChangeText={onChange}
								onBlur={onBlur}
								multiline
								errorMessage={error?.message}
								containerStyle={styles.memoInput}
							/>
						)}
					/>
					<Button
						title="保存"
						onPress={handleSubmit(onSubmit)}
						buttonStyle={styles.saveButton}
					/>
				</Animated.View>
			</PanGestureHandler>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: "flex-end",
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	contentContainer: {
		backgroundColor: "white",
		padding: 20,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		height: SCREEN_HEIGHT * 0.75,
	},
	handle: {
		width: 40,
		height: 5,
		backgroundColor: "#00000030",
		alignSelf: "center",
		marginBottom: 10,
		borderRadius: 4,
	},
	statusButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginVertical: 15,
	},
	statusButton: {
		paddingHorizontal: 10,
		minWidth: 100,
	},
	memoInput: {
		marginBottom: 15,
	},
	saveButton: {
		marginTop: 10,
	},
});

export default CalendarOverlay;
