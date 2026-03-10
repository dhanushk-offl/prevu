use clap::{Parser, Subcommand};

#[derive(Debug, Parser)]
#[command(name = "prevu", version, about = "Instant social preview inspector for developers")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Inspect {
        url: String,
        #[arg(long)]
        json: bool,
    },
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();

    match cli.command {
        Commands::Inspect { url, json } => match prevu_core::inspect_url(&url).await {
            Ok(result) => {
                if json {
                    match serde_json::to_string_pretty(&result) {
                        Ok(payload) => println!("{payload}"),
                        Err(err) => {
                            eprintln!("failed to render JSON output: {err}");
                            std::process::exit(1);
                        }
                    }
                    return;
                }

                print_text_result(&result);
            }
            Err(err) => {
                eprintln!("error: {err}");
                std::process::exit(1);
            }
        },
    }
}

fn print_text_result(result: &prevu_core::InspectResult) {
    println!("Inspecting: {}", result.source_url);
    println!("Resolved:   {}", result.resolved_url);
    println!();

    for item in &result.validation.passed {
        println!("[OK] {item}");
    }

    for warning in &result.validation.warnings {
        println!("[WARN] {warning}");
    }

    if let Some(image) = &result.image_info {
        println!();
        println!(
            "Image: {}x{}, {:.2} ratio, {} bytes",
            image.width, image.height, image.aspect_ratio, image.file_size_bytes
        );
    }
}
